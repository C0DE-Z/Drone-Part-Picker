import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch build from database
    const build = await prisma.droneBuild.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    // Check if build is public or if user owns it
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.email === build.user.email;
    
    if (!build.isPublic && !isOwner) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    // Transform the data to match frontend expectations
    const transformedBuild = {
      id: build.id,
      name: build.name,
      description: build.description,
      createdAt: build.createdAt,
      user: build.user,
      components: {
        motor: build.motor || null,
        frame: build.frame || null,
        stack: build.stack || null,
        camera: build.camera || null,
        prop: build.prop || null,
        battery: build.battery || null,
      },
      performance: {
        totalWeight: build.totalWeight,
        thrustToWeightRatio: build.thrustToWeightRatio,
        estimatedTopSpeed: build.estimatedTopSpeed,
        flightTime: build.estimatedFlightTime,
        powerConsumption: build.powerConsumption,
      },
      tags: build.tags ? (Array.isArray(build.tags) ? build.tags : []) : [],
      _count: build._count,
      likes: build.likes,
      comments: build.comments,
    };

    return NextResponse.json({ build: transformedBuild });
  } catch (error) {
    console.error('Error fetching build:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
