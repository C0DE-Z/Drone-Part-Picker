import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check admin permissions
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if Badge table exists and has data
    let badgeSystemStatus = 'unknown';
    let badgeCount = 0;
    
    try {
      badgeCount = await prisma.badge.count();
      badgeSystemStatus = badgeCount > 0 ? 'active' : 'empty';
    } catch {
      badgeSystemStatus = 'missing';
    }

    // Check if UserBadge table exists and has data
    let userBadgeCount = 0;
    let userBadgeSystemStatus = 'unknown';
    
    try {
      userBadgeCount = await prisma.userBadge.count();
      userBadgeSystemStatus = userBadgeCount > 0 ? 'active' : 'empty';
    } catch {
      userBadgeSystemStatus = 'missing';
    }

    let partModelStatus = 'unknown';
    
    try {
      await prisma.customPart.findFirst({
        select: {
          id: true,
          modelFile: true,
          modelSize: true,
          modelFormat: true
        }
      });
      partModelStatus = 'available';
    } catch {
      partModelStatus = 'missing';
    }

    let overallStatus = 'healthy';
    let statusMessage = '✅ All database features are available';
    let statusColor = 'text-green-600';

    if (badgeSystemStatus === 'missing' || userBadgeSystemStatus === 'missing' || partModelStatus === 'missing') {
      overallStatus = 'migration_needed';
      statusMessage = '⚠️ Database migration needed - Some features unavailable';
      statusColor = 'text-red-600';
    } else if (badgeSystemStatus === 'empty' && userBadgeCount === 0) {
      overallStatus = 'setup_needed';
      statusMessage = '⚠️ Database setup needed - Badge system not initialized';
      statusColor = 'text-yellow-600';
    }

    return NextResponse.json({
      success: true,
      status: overallStatus,
      message: statusMessage,
      color: statusColor,
      details: {
        badges: {
          status: badgeSystemStatus,
          count: badgeCount
        },
        userBadges: {
          status: userBadgeSystemStatus,
          count: userBadgeCount
        },
        partModels: {
          status: partModelStatus
        }
      }
    });

  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json({ error: 'Failed to check database status' }, { status: 500 });
  }
}
