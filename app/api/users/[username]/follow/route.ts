import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = params

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Get the user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username }
    })

    if (!currentUser || !userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't follow yourself
    if (currentUser.id === userToFollow.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userToFollow.id
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: userToFollow.id
      }
    })

    return NextResponse.json({ message: 'Successfully followed user' })
  } catch (error) {
    console.error('Error following user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = params

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Get the user to unfollow
    const userToUnfollow = await prisma.user.findUnique({
      where: { username }
    })

    if (!currentUser || !userToUnfollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete follow relationship
    await prisma.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: userToUnfollow.id
      }
    })

    return NextResponse.json({ message: 'Successfully unfollowed user' })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
