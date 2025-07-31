import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Function to generate a simple username from email
function generateUsername(email: string): string {
  const localPart = email.split('@')[0];
  // Remove any special characters and convert to lowercase
  const cleanedName = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  // Add a random suffix to ensure uniqueness
  const suffix = Math.floor(Math.random() * 1000);
  return `${cleanedName}${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user already has a username, return it
    if (user.username) {
      return NextResponse.json({ username: user.username });
    }

    // Generate a username for the user
    let username = generateUsername(user.email);
    let attempts = 0;
    
    // Ensure uniqueness
    while (attempts < 10) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username }
      });
      
      if (!existingUser) {
        break;
      }
      
      attempts++;
      const suffix = Math.floor(Math.random() * 10000);
      username = `${generateUsername(user.email).split(/\d+/)[0]}${suffix}`;
    }

    // Update the user with the new username
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username: username }
    });

    return NextResponse.json({ username: updatedUser.username });
  } catch (error) {
    console.error('Error generating username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
