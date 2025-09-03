import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/validation';
import { z } from 'zod';

const adminRoleActionRateLimit = new RateLimiter(20, 60 * 1000); // 20 role changes per minute

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN'])
});

// PUT /api/admin/roles - Update user roles
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

    if (!adminRoleActionRateLimit.isAllowed(session!.user!.email!)) {
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
      select: { 
        email: true, 
        username: true,
        // role: true  // This will be available after migration
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, we'll log the role change since the database doesn't have the role field yet
    // After migration, uncomment this:
    /*
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any }
    });
    */

    console.log(`ADMIN ACTION: ${session!.user!.email} changed role for user ${user.email} (${user.username}) to ${role}`);

    return NextResponse.json({
      success: true,
      message: `User role will be updated to ${role} (requires database migration)`,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        newRole: role
      }
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
