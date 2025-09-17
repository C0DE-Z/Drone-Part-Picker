import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const deleteSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  postType: z.enum(['build', 'part', 'comment']),
  reason: z.string().min(10, 'Deletion reason must be at least 10 characters')
});

export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin status
    const adminStatus = await isCurrentUserAdmin();
    if (!adminStatus) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = deleteSchema.parse(body);
    const { postId, postType, reason } = validatedData;

    // Log the deletion for audit trail
    console.log(`Admin ${session.user.email} deleting ${postType} ${postId} - Reason: ${reason}`);
    
    // Actually delete from database based on type
    switch (postType) {
      case 'build':
        // First check if build exists
        const build = await prisma.droneBuild.findUnique({
          where: { id: postId },
          select: { id: true, name: true, user: { select: { email: true } } }
        });
        
        if (!build) {
          return NextResponse.json(
            { success: false, error: 'Build not found' },
            { status: 404 }
          );
        }

        // Delete the build (cascading will handle related likes, comments, reports)
        await prisma.droneBuild.delete({
          where: { id: postId }
        });

        console.log(`✅ Deleted build "${build.name}" by ${build.user.email}`);
        break;

      case 'part':
        // First check if part exists
        const part = await prisma.customPart.findUnique({
          where: { id: postId },
          select: { id: true, name: true, user: { select: { email: true } } }
        });
        
        if (!part) {
          return NextResponse.json(
            { success: false, error: 'Part not found' },
            { status: 404 }
          );
        }

        // Delete the part (cascading will handle related likes, comments, reports)
        await prisma.customPart.delete({
          where: { id: postId }
        });

        console.log(`✅ Deleted part "${part.name}" by ${part.user.email}`);
        break;

      case 'comment':
        // First check if comment exists
        const comment = await prisma.comment.findUnique({
          where: { id: postId },
          select: { 
            id: true, 
            content: true, 
            user: { select: { email: true } },
            build: { select: { name: true } },
            part: { select: { name: true } }
          }
        });
        
        if (!comment) {
          return NextResponse.json(
            { success: false, error: 'Comment not found' },
            { status: 404 }
          );
        }

        // Delete the comment (cascading will handle related reports)
        await prisma.comment.delete({
          where: { id: postId }
        });

        const targetName = comment.build?.name || comment.part?.name || 'Unknown';
        console.log(`✅ Deleted comment by ${comment.user.email} on "${targetName}"`);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid post type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `${postType} deleted successfully`,
      deletedId: postId,
      reason
    });

  } catch (error) {
    console.error('Delete post error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      );
    }

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { success: false, error: 'Item not found or already deleted' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/posts - Get all posts for admin management
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin status
    const adminStatus = await isCurrentUserAdmin();
    if (!adminStatus) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Fetch builds, parts, and comments from database
    const [builds, parts, comments] = await Promise.all([
      // Fetch builds
      prisma.droneBuild.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),

      // Fetch custom parts
      prisma.customPart.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),

      // Fetch comments
      prisma.comment.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          build: {
            select: {
              id: true,
              name: true
            }
          },
          part: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        builds,
        parts,
        comments
      },
      pagination: {
        page,
        limit,
        total: builds.length + parts.length + comments.length
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
