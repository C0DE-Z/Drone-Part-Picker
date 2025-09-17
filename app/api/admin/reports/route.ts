import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/validation';
import { z } from 'zod';
import { ReportStatus } from '@prisma/client';

const adminReportActionRateLimit = new RateLimiter(30, 60 * 1000); // 30 report actions per minute

const updateReportSchema = z.object({
  reportId: z.string().cuid(),
  status: z.enum(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']),
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

    // Build where clause for filtering
    const whereClause: { status?: ReportStatus } = {};
    if (status && ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      whereClause.status = status as ReportStatus;
    }

    // Fetch reports from database
    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            username: true
          }
        },
        build: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        },
        part: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        },
        comment: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
                email: true
              }
            }
          }
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalReports = await prisma.report.count({
      where: whereClause
    });

    // Transform reports for frontend
    const transformedReports = reports.map(report => ({
      id: report.id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      targetType: report.buildId ? 'build' : 
                  report.partId ? 'part' : 
                  report.commentId ? 'comment' : 
                  report.reportedUserId ? 'user' : 'unknown',
      targetId: report.buildId || report.partId || report.commentId || report.reportedUserId,
      targetName: report.build?.name || 
                  report.part?.name || 
                  (report.comment?.content ? report.comment.content.substring(0, 50) + '...' : '') ||
                  report.reportedUser?.username || 
                  'Unknown',
      reportedBy: report.reporter.username || report.reporter.email,
      reporterId: report.reporter.id,
      createdAt: report.createdAt,
      reviewedBy: report.reviewedBy?.username || report.reviewedBy?.email,
      reviewedAt: report.reviewedAt,
      adminNotes: report.adminNotes
    }));

    return NextResponse.json({
      success: true,
      data: transformedReports,
      pagination: {
        page,
        limit,
        offset,
        total: totalReports,
        totalPages: Math.ceil(totalReports / limit)
      }
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

    // Get admin user for reviewedBy field
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Update the report in database
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as ReportStatus,
        adminNotes: adminNotes || null,
        reviewedById: adminUser.id,
        reviewedAt: new Date()
      },
      include: {
        reporter: {
          select: {
            username: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log(`ADMIN ACTION: ${session!.user!.email} updated report ${reportId} to ${status}`);
    if (adminNotes) {
      console.log(`Admin notes: ${adminNotes}`);
    }

    return NextResponse.json({
      success: true,
      message: `Report ${reportId} status updated to ${status}`,
      report: {
        id: updatedReport.id,
        status: updatedReport.status,
        adminNotes: updatedReport.adminNotes,
        updatedBy: updatedReport.reviewedBy?.username || updatedReport.reviewedBy?.email,
        updatedAt: updatedReport.reviewedAt
      }
    });

  } catch (error) {
    console.error('Error updating report:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
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

    // Delete the report from database
    await prisma.report.delete({
      where: { id: reportId }
    });

    console.log(`ADMIN ACTION: ${session!.user!.email} deleted report ${reportId}`);

    return NextResponse.json({
      success: true,
      message: `Report ${reportId} deleted successfully`,
      deletedId: reportId
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
