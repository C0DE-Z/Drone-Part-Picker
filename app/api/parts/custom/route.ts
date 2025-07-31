import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const publicOnly = searchParams.get('public') === 'true';

    const where: {
      category?: string;
      isPublic?: boolean;
    } = {};
    
    if (category) {
      where.category = category;
    }
    
    if (publicOnly) {
      where.isPublic = true;
    }

    // For now, return an empty array until the Prisma client is regenerated
    const customParts: unknown[] = [];

    return NextResponse.json({ customParts });
  } catch (error) {
    console.error('Error fetching custom parts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, category, specifications, isPublic } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const customPart = await prisma.customPart.create({
      data: {
        name,
        description,
        category,
        specifications: specifications || {},
        isPublic: isPublic || false,
        userId: user.id,
      },
    });

    return NextResponse.json({ part: customPart });
  } catch (error) {
    console.error('Error creating custom part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
