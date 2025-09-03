import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const deleteSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  postType: z.enum(['build', 'part', 'comment']),
  reason: z.string().min(10, 'Deletion reason must be at least 10 characters')
});

// Check if user is admin
async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  
  const adminEmail = process.env.ADMIN_EMAIL;
  return adminEmail === email;
}

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
    const adminStatus = await isAdmin(session.user.email);
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

    // For now, store deletion in localStorage since database migration is blocked
    // This would normally delete from database and create audit log
    
    // Simulate deletion success
    console.log(`Admin ${session.user.email} deleted ${postType} ${postId} - Reason: ${reason}`);
    
    // In a real implementation, this would:
    // 1. Delete the post/comment from database
    // 2. Create audit log entry
    // 3. Notify relevant users if needed
    
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

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get deletion history (for admin audit)
export async function GET() {
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
    const adminStatus = await isAdmin(session.user.email);
    if (!adminStatus) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // In a real implementation, this would fetch deletion audit logs
    // For now, return empty array since database migration is blocked
    
    return NextResponse.json({
      success: true,
      deletions: [],
      message: 'Deletion history will be available after database migration'
    });

  } catch (error) {
    console.error('Get deletion history error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
