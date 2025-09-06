import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAndSanitize, RateLimiter } from '@/lib/validation';
import { z } from 'zod';

const reportRateLimit = new RateLimiter(10, 60 * 1000); // 10 reports per minute

const reportSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(100, 'Reason must be at most 100 characters').trim(),
  description: z.string().max(500, 'Description must be at most 500 characters').trim().optional(),
  targetType: z.enum(['build', 'part', 'comment', 'user']),
  targetId: z.string().uuid('Invalid target ID')
});

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    if (!reportRateLimit.isAllowed(session.user.email)) {
      return NextResponse.json(
        { error: 'Too many reports. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = reportSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reason, description, targetType, targetId } = validation.data;

    // Get reporter user
    const reporter = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!reporter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the target exists and get additional info
    let targetExists = false;
    let targetOwner = null;

    switch (targetType) {
      case 'build':
        const build = await prisma.droneBuild.findUnique({
          where: { id: targetId },
          select: { id: true, userId: true, name: true }
        });
        targetExists = !!build;
        targetOwner = build?.userId;
        break;

      case 'part':
        const part = await prisma.customPart.findUnique({
          where: { id: targetId },
          select: { id: true, userId: true, name: true }
        });
        targetExists = !!part;
        targetOwner = part?.userId;
        break;

      case 'comment':
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { id: true, userId: true, content: true }
        });
        targetExists = !!comment;
        targetOwner = comment?.userId;
        break;

      case 'user':
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, email: true }
        });
        targetExists = !!user;
        break;
    }

    if (!targetExists) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 });
    }

    // Prevent self-reporting (except for users)
    if (targetType !== 'user' && targetOwner === reporter.id) {
      return NextResponse.json({ error: 'Cannot report your own content' }, { status: 400 });
    }

    // Check for duplicate reports
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: reporter.id,
        ...(targetType === 'build' && { buildId: targetId }),
        ...(targetType === 'part' && { partId: targetId }),
        ...(targetType === 'comment' && { commentId: targetId }),
        ...(targetType === 'user' && { reportedUserId: targetId }),
        status: { in: ['PENDING', 'REVIEWING'] }
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this content' }, { status: 409 });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reason: validateAndSanitize(z.string(), reason),
        description: description ? validateAndSanitize(z.string(), description) : null,
        reporterId: reporter.id,
        ...(targetType === 'build' && { buildId: targetId }),
        ...(targetType === 'part' && { partId: targetId }),
        ...(targetType === 'comment' && { commentId: targetId }),
        ...(targetType === 'user' && { reportedUserId: targetId }),
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully',
      reportId: report.id
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}

// GET /api/reports - Get user's reports (for users to see their own reports)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reports = await prisma.report.findMany({
      where: { reporterId: user.id },
      include: {
        build: { select: { name: true } },
        part: { select: { name: true } },
        comment: { select: { content: true } },
        reportedUser: { select: { username: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    const totalReports = await prisma.report.count({
      where: { reporterId: user.id }
    });

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total: totalReports,
        totalPages: Math.ceil(totalReports / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
