import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAndSanitize, RateLimiter } from '@/lib/validation';
import { z } from 'zod';

const customPartsRateLimit = new RateLimiter(10, 60 * 1000); // 10 custom parts per minute

const customPartSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').trim(),
  description: z.string().max(500, 'Description must be at most 500 characters').trim().optional(),
  category: z.string().min(1, 'Category is required').max(50, 'Category must be at most 50 characters').trim(),
  specifications: z.object({}).passthrough().optional(),
  isPublic: z.boolean().optional()
});

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

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitKey = `${session.user.email}-${clientIp}`;
    
    if (!customPartsRateLimit.isAllowed(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = customPartSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, description, category, specifications, isPublic } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Sanitize and validate specifications object
    const sanitizedSpecs = specifications ? 
      validateAndSanitize(z.object({}).passthrough(), specifications) : {};

    const customPart = await prisma.customPart.create({
      data: {
        name: validateAndSanitize(z.string(), name),
        description: description ? validateAndSanitize(z.string(), description) : null,
        category: validateAndSanitize(z.string(), category),
        specifications: sanitizedSpecs as object,
        isPublic: isPublic || false,
        userId: user.id,
      },
    });

    return NextResponse.json({ part: customPart });
  } catch (error) {
    console.error('Error creating custom part:', error);
    return NextResponse.json({ error: 'Failed to create custom part' }, { status: 500 });
  }
}
