import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all public builds from database
    const builds = await prisma.droneBuild.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        likes: true,
        comments: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform builds to match the expected format
    const transformedBuilds = builds.map(build => ({
      id: build.id,
      name: build.name,
      description: build.description,
      createdAt: build.createdAt.toISOString(),
      user: {
        username: build.user.username || 'Anonymous',
        email: build.user.email
      },
      components: {
        motor: build.motor,
        frame: build.frame,
        stack: build.stack,
        camera: build.camera,
        prop: build.prop,
        battery: build.battery,
      },
      performance: {
        totalWeight: build.totalWeight,
        thrustToWeightRatio: build.thrustToWeightRatio,
        estimatedTopSpeed: build.estimatedTopSpeed,
        flightTime: build.estimatedFlightTime,
        powerConsumption: build.powerConsumption,
      },
      tags: build.tags,
      viewCount: build.viewCount || 0,
      likesCount: build._count.likes,
      commentsCount: build._count.comments
    }));

    return NextResponse.json({ builds: transformedBuilds });
  } catch (error) {
    console.error('Error fetching public builds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
