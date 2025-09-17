import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/validation';
import { z } from 'zod';

const likesRateLimit = new RateLimiter(100, 60 * 1000); // 100 likes per minute

const likeSchema = z.object({
  buildId: z.string().uuid().optional(),
  partId: z.string().uuid().optional(),
}).refine(data => data.buildId || data.partId, {
  message: "Either buildId or partId must be provided",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitKey = `${session.user.email}-${clientIp}`;
    
    if (!likesRateLimit.isAllowed(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = likeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { buildId, partId } = validation.data;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the item exists and is accessible
    if (buildId) {
      const build = await prisma.droneBuild.findUnique({
        where: { id: buildId },
        select: { isPublic: true, userId: true }
      });
      
      if (!build) {
        return NextResponse.json({ error: 'Build not found' }, { status: 404 });
      }
      
      if (!build.isPublic && build.userId !== user.id) {
        return NextResponse.json({ error: 'Build not accessible' }, { status: 403 });
      }
    }

    if (partId) {
      const part = await prisma.customPart.findUnique({
        where: { id: partId },
        select: { isPublic: true, userId: true }
      });
      
      if (!part) {
        return NextResponse.json({ error: 'Part not found' }, { status: 404 });
      }
      
      if (!part.isPublic && part.userId !== user.id) {
        return NextResponse.json({ error: 'Part not accessible' }, { status: 403 });
      }
    }

    // Check if like already exists
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: user.id,
        ...(buildId ? { buildId } : { partId })
      }
    });
    
    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      
      const likeCount = await prisma.like.count({
        where: buildId ? { buildId } : { partId }
      });
      
      return NextResponse.json({ liked: false, likeCount });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: user.id,
          ...(buildId ? { buildId } : { partId })
        }
      });
      
      const likeCount = await prisma.like.count({
        where: buildId ? { buildId } : { partId }
      });
      
      return NextResponse.json({ liked: true, likeCount });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buildId = searchParams.get('buildId');
    const partId = searchParams.get('partId');
    
    if (!buildId && !partId) {
      return NextResponse.json({ error: 'Either buildId or partId is required' }, { status: 400 });
    }

    // Get like count from database
    const likeCount = await prisma.like.count({
      where: buildId ? { buildId } : { partId }
    });
    
    // Check if current user has liked this item
    const session = await getServerSession(authOptions);
    let liked = false;
    
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      
      if (user) {
        const userLike = await prisma.like.findFirst({
          where: {
            userId: user.id,
            ...(buildId ? { buildId } : { partId })
          }
        });
        liked = !!userLike;
      }
    }
    
    return NextResponse.json({ likeCount, liked });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
