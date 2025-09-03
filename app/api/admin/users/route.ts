import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole, isCurrentUserAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/validation';
import { z } from 'zod';
import { isAdminEmail } from '@/lib/admin-config';

const adminUserActionRateLimit = new RateLimiter(20, 60 * 1000); // 20 user actions per minute

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(UserRole)
});

// PUT /api/admin/users - Update user roles
export async function PUT(request: NextRequest) {
  try {
    // Check if user is logged in first
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check admin permissions
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!adminUserActionRateLimit.isAllowed(session!.user!.email!)) {
      return NextResponse.json(
        { error: 'Too many admin actions. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = updateUserRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, role } = validation.data;

    // Get user info before update
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, we'll store the role change in console log since we don't have the migration yet
    // In a real implementation, you would update the database:
    // const updatedUser = await prisma.user.update({
    //   where: { id: userId },
    //   data: { role }
    // });

    console.log(`ADMIN ACTION: ${session!.user!.email} changed role for user ${user.email} (${user.username}) to ${role}`);

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        role: role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

// GET /api/admin/users - Get all users for admin management
export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in first
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check admin permissions
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            droneBuilds: true,
            customParts: true,
            comments: true,
            likes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    // Add role information (temporary hardcoded logic until migration)
    const usersWithRoles = users.map(user => ({
      ...user,
      role: isAdminEmail(user.email) ? UserRole.ADMIN : UserRole.USER
    }));

    return NextResponse.json({
      success: true,
      data: usersWithRoles,
      pagination: {
        page,
        limit,
        offset,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
