import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { commentSchema, validateAndSanitize, commentRateLimiter } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buildId = searchParams.get('buildId');
    const partId = searchParams.get('partId');
    
    if (!buildId && !partId) {
      return NextResponse.json({ error: 'Either buildId or partId is required' }, { status: 400 });
    }

    // Validate ID format (basic validation)
    if (buildId && typeof buildId !== 'string') {
      return NextResponse.json({ error: 'Invalid buildId format' }, { status: 400 });
    }
    if (partId && typeof partId !== 'string') {
      return NextResponse.json({ error: 'Invalid partId format' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        ...(buildId ? { buildId } : { partId }),
      },
      include: {
        user: {
          select: {
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit comments to prevent excessive data transfer
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || session.user.email;
    
    // Check rate limit
    if (!commentRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Too many comments. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json();
    const { buildId, partId } = body;
    
    if (!buildId && !partId) {
      return NextResponse.json({ error: 'Either buildId or partId is required' }, { status: 400 });
    }

    // Validate and sanitize comment content
    let validatedData;
    try {
      validatedData = validateAndSanitize(commentSchema, { content: body.content });
    } catch {
      return NextResponse.json(
        { error: 'Invalid comment content' },
        { status: 400 }
      )
    }

    const { content } = validatedData;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify that the build/part exists and is accessible
    if (buildId) {
      const build = await prisma.droneBuild.findUnique({
        where: { id: buildId },
        select: { isPublic: true, userId: true }
      });
      
      if (!build || (!build.isPublic && build.userId !== user.id)) {
        return NextResponse.json({ error: 'Build not found or not accessible' }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: user.id,
        ...(buildId ? { buildId } : { partId }),
      },
      include: {
        user: {
          select: {
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
