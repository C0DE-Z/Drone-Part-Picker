import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ isFollowing: false })
    }

    const { username } = params

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { username }
    })

    if (!currentUser || !targetUser) {
      return NextResponse.json({ isFollowing: false })
    }

    // Check if following
    const followRelation = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id
        }
      }
    })

    return NextResponse.json({ isFollowing: !!followRelation })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json({ isFollowing: false })
  }
}
