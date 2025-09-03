import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/validation';

const publicBuildsRateLimit = new RateLimiter(60, 60 * 1000); // 60 requests per minute for public endpoint

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for public endpoint to prevent abuse
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!publicBuildsRateLimit.isAllowed(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Fetch all public builds from database with limit
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
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit results to prevent excessive data transfer
    });

    // Transform builds to match the expected format
    const transformedBuilds = builds.map(build => ({
      id: build.id,
      name: build.name,
      description: build.description,
      createdAt: build.createdAt.toISOString(),
      user: {
        username: build.user.username || 'Anonymous',
        // Don't expose email in public endpoint for privacy
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
    return NextResponse.json({ error: 'Failed to fetch builds' }, { status: 500 });
  }
}
