import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAndSanitize, RateLimiter } from '@/lib/validation';
import { z } from 'zod';

const profileUpdateRateLimit = new RateLimiter(5, 60 * 1000); // 5 profile updates per minute

const profileUpdateSchema = z.object({
  bio: z.string().max(500, 'Bio must be at most 500 characters').trim().optional(),
  location: z.string().max(100, 'Location must be at most 100 characters').trim().optional(),
  website: z.string().url('Invalid website URL').max(200, 'Website URL must be at most 200 characters').optional().or(z.literal('')),
  github: z.string().max(100, 'GitHub username must be at most 100 characters').trim().optional(),
  twitter: z.string().max(100, 'Twitter username must be at most 100 characters').trim().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').trim().optional()
});

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
        userBadges: {
          where: { isVisible: true },
          include: {
            badge: true
          }
        },
        _count: {
          select: {
            droneBuilds: true,
            customParts: true,
            followers: true,
            following: true,
            likes: true
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
    
    // Extract badges from user's badge assignments (only active badges)
    const badges = user.userBadges
      .filter(userBadge => userBadge.badge.isActive)
      .map(userBadge => ({
        id: userBadge.badge.id,
        name: userBadge.badge.name,
        description: userBadge.badge.description,
        type: userBadge.badge.type,
        icon: userBadge.badge.icon,
        color: userBadge.badge.color,
        rarity: userBadge.badge.rarity,
        awardedAt: userBadge.awardedAt.toISOString(),
        reason: userBadge.reason
      }));
    
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
      role: user.role,
      badges: badges,
      _count: {
        droneBuilds: user._count.droneBuilds,
        customParts: user._count.customParts,
        followers: user._count.followers,
        following: user._count.following,
        likes: user._count.likes
      },
      buildsCount: user._count.droneBuilds,
      partsCount: user._count.customParts,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isOwnProfile,
      createdAt: user.createdAt.toISOString()
    };

    return NextResponse.json(profile);
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

    // Rate limiting
    if (!profileUpdateRateLimit.isAllowed(session.user.email)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { username: true }
    });

    if (!sessionUser || sessionUser.username !== username) {
      return NextResponse.json({ error: 'Can only update your own profile' }, { status: 403 });
    }

    const body = await request.json();
    const validation = profileUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { bio, location, website, github, twitter, username: newUsername } = validation.data;

    // If username is being changed, check for uniqueness
    if (newUsername && newUsername !== username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: newUsername }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
    }

    // Sanitize all string inputs
    const sanitizedData = {
      bio: bio ? validateAndSanitize(z.string(), bio) : undefined,
      location: location ? validateAndSanitize(z.string(), location) : undefined,
      website: website && website !== '' ? validateAndSanitize(z.string(), website) : undefined,
      github: github ? validateAndSanitize(z.string(), github) : undefined,
      twitter: twitter ? validateAndSanitize(z.string(), twitter) : undefined,
      username: newUsername ? validateAndSanitize(z.string(), newUsername) : undefined,
      updatedAt: new Date()
    };

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(sanitizedData).filter(([, value]) => value !== undefined)
    );

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { username: username },
      data: updateData,
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
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
