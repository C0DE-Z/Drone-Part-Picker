import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Award a badge to a user (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const { username } = await params

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { username }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { badgeId, reason } = body

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID is required' }, { status: 400 })
    }

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: badgeId }
    })

    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    // Check if user already has this badge
    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: targetUser.id,
          badgeId: badgeId
        }
      }
    })

    if (existingUserBadge) {
      return NextResponse.json({ error: 'User already has this badge' }, { status: 400 })
    }

    // Award the badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId: targetUser.id,
        badgeId: badgeId,
        awardedBy: adminUser.id,
        reason: reason || `Awarded by ${adminUser.username || adminUser.email}`
      }
    })

    return NextResponse.json({ userBadge }, { status: 201 })
  } catch (error) {
    console.error('Error awarding badge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove a badge from a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const { username } = await params

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { username }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { badgeId } = body

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID is required' }, { status: 400 })
    }

    // Remove the badge
    await prisma.userBadge.deleteMany({
      where: {
        userId: targetUser.id,
        badgeId: badgeId
      }
    })

    return NextResponse.json({ message: 'Badge removed successfully' })
  } catch (error) {
    console.error('Error removing badge:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
