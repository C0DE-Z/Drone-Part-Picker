import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin-config';

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export interface UserWithRole {
  id: string;
  email: string;
  username?: string | null;
  role: UserRole;
}

// Check if user has required role or higher
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.MODERATOR]: 1,
    [UserRole.ADMIN]: 2
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Get current user with role information
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      username: true,
      // For now, we'll use environment variable check until the migration is complete
    }
  });

  if (!user) {
    return null;
  }

  // Check if user is admin using environment variable
  const userIsAdmin = isAdminEmail(user.email);
  
  return {
    ...user,
    role: userIsAdmin ? UserRole.ADMIN : UserRole.USER
  };
}

// Check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  return user ? hasRole(user.role, UserRole.ADMIN) : false;
}

// Check if current user is moderator or admin
export async function isCurrentUserModerator(): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  return user ? hasRole(user.role, UserRole.MODERATOR) : false;
}

// Middleware function to check admin access
export async function requireAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}

// Middleware function to check moderator access
export async function requireModerator() {
  const isModerator = await isCurrentUserModerator();
  if (!isModerator) {
    throw new Error('Moderator access required');
  }
}
