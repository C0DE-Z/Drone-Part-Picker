import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    // Find user by username for user-friendly URLs
    const user = await prisma.user.findUnique({
      where: { username: username },
      include: {
        _count: {
          select: {
            droneBuilds: { where: { isPublic: true } },
            customParts: { where: { isPublic: true } },
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is following this profile
    let isFollowing = false;
    if (session?.user?.email && session.user.email !== user.email) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.email,
            followingId: user.email
          }
        }
      });
      isFollowing = !!followRelation;
    }

    // Only expose public information - no email or other sensitive data
    const isOwnProfile = session?.user?.email === user.email;
    
    const profile = {
      id: user.id,
      name: user.username || 'Anonymous User', // Use username instead of real name
      username: user.username,
      // Never include email in public responses
      bio: user.bio,
      location: user.location,
      website: user.website,
      github: user.github,
      twitter: user.twitter,
      image: user.image,
      buildsCount: user._count.droneBuilds,
      partsCount: user._count.customParts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isOwnProfile,
      createdAt: user.createdAt.toISOString()
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await params;
    
    // Check if user is updating their own profile
    if (!session.user?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true }
    });

    if (!sessionUser || sessionUser.username !== username) {
      return NextResponse.json({ error: 'Can only update your own profile' }, { status: 403 });
    }

    const { bio, location, website, github, twitter, username: newUsername } = await request.json();

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { username: username },
      data: {
        bio,
        location,
        website,
        github,
        twitter,
        ...(newUsername && { username: newUsername }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        github: true,
        twitter: true,
        image: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ profile: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
