import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { userRegistrationSchema, validateAndSanitize, authRateLimiter } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    
    // Check rate limit
    if (!authRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = validateAndSanitize(userRegistrationSchema, body);
    } catch (err: unknown) {
      // Return zod validation issues if present
      const zErr = err as { errors?: Array<{ message?: string }> };
      const message = zErr?.errors?.[0]?.message || 'Invalid input data';
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    const { username, email, password } = validatedData as { username: string; email: string; password: string };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Ensure username is unique (create if not provided in model yet)
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Hash password with higher cost for better security
    const hashedPassword = await bcrypt.hash(password, 14)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(), // Store email in lowercase
        password: hashedPassword
      }
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
