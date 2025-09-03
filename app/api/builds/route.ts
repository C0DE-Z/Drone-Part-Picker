import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildSchema, validateAndSanitize, buildRateLimiter } from '@/lib/validation';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || session.user.email;
    
    // Check rate limit
    if (!buildRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json();

    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = validateAndSanitize(buildSchema, body);
    } catch {
      return NextResponse.json(
        { error: 'Invalid build data' },
        { status: 400 }
      )
    }

    const { name, description, components, performance, isPublic, tags } = validatedData;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const build = await prisma.droneBuild.create({
      data: {
        name,
        description: description || null,
        userId: user.id,
        isPublic: isPublic || false,
        tags: tags || [],
        motor: components?.motor ? (components.motor as Prisma.InputJsonValue) : undefined,
        frame: components?.frame ? (components.frame as Prisma.InputJsonValue) : undefined,
        stack: components?.stack ? (components.stack as Prisma.InputJsonValue) : undefined,
        camera: components?.camera ? (components.camera as Prisma.InputJsonValue) : undefined,
        prop: components?.prop ? (components.prop as Prisma.InputJsonValue) : undefined,
        battery: components?.battery ? (components.battery as Prisma.InputJsonValue) : undefined,
        totalWeight: performance?.totalWeight || null,
        thrustToWeightRatio: performance?.thrustToWeightRatio || null,
        estimatedTopSpeed: performance?.estimatedTopSpeed || null,
        estimatedFlightTime: performance?.flightTime || null,
        powerConsumption: performance?.powerConsumption || null,
      }
    });

    return NextResponse.json({ success: true, build });
  } catch (error) {
    console.error('Error saving build:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const builds = await prisma.droneBuild.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Transform builds to match the expected format
    const transformedBuilds = builds.map(build => ({
      id: build.id,
      name: build.name,
      createdAt: build.createdAt.toISOString(),
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
      }
    }));

    return NextResponse.json({ builds: transformedBuilds });
  } catch (error) {
    console.error('Error fetching builds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
