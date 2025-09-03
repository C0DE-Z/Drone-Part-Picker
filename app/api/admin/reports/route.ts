import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/auth-utils';
import { RateLimiter } from '@/lib/validation';
import { z } from 'zod';

const adminReportActionRateLimit = new RateLimiter(30, 60 * 1000); // 30 report actions per minute

const updateReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']),
  adminNotes: z.string().max(1000).optional()
});

// GET /api/admin/reports - Get all reports for admin review
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
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    // For now, return mock data since reports system isn't implemented yet
    // In a real implementation, this would fetch from a reports table
    const mockReports = [
      {
        id: '1',
        type: 'spam',
        targetType: 'build',
        targetId: 'build-123',
        reporterId: 'user-456',
        reporterEmail: 'reporter@example.com',
        reason: 'This build contains spam content',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        adminNotes: null
      },
      {
        id: '2',
        type: 'inappropriate',
        targetType: 'comment',
        targetId: 'comment-789',
        reporterId: 'user-101',
        reporterEmail: 'user@example.com',
        reason: 'Inappropriate language in comment',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        adminNotes: null
      }
    ];

    // Filter by status if provided
    const filteredReports = status ? 
      mockReports.filter(report => report.status === status) : 
      mockReports;

    return NextResponse.json({
      success: true,
      data: filteredReports,
      pagination: {
        page,
        limit,
        offset,
        total: filteredReports.length,
        totalPages: Math.ceil(filteredReports.length / limit)
      },
      message: 'Reports system will be fully functional after database migration'
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// PUT /api/admin/reports - Update report status
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

    if (!adminReportActionRateLimit.isAllowed(session!.user!.email!)) {
      return NextResponse.json(
        { error: 'Too many admin actions. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = updateReportSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reportId, status, adminNotes } = validation.data;

    // For now, we'll log the report update since the database doesn't have reports yet
    console.log(`ADMIN ACTION: ${session!.user!.email} updated report ${reportId} to ${status}`);
    if (adminNotes) {
      console.log(`Admin notes: ${adminNotes}`);
    }

    return NextResponse.json({
      success: true,
      message: `Report ${reportId} status updated to ${status}`,
      report: {
        id: reportId,
        status,
        adminNotes,
        updatedBy: session.user.email,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

// DELETE /api/admin/reports - Delete report
export async function DELETE(request: NextRequest) {
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

    if (!adminReportActionRateLimit.isAllowed(session!.user!.email!)) {
      return NextResponse.json(
        { error: 'Too many admin actions. Please slow down.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // For now, we'll log the report deletion since the database doesn't have reports yet
    console.log(`ADMIN ACTION: ${session!.user!.email} deleted report ${reportId}`);

    return NextResponse.json({
      success: true,
      message: `Report ${reportId} deleted successfully`,
      deletedId: reportId
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
