import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { buildId, partId } = await request.json();
    
    if (!buildId && !partId) {
      return NextResponse.json({ error: 'Either buildId or partId is required' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
    //     }
    //   });
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
