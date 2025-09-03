import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB in bytes
const ALLOWED_FORMATS = ['glb', 'gltf', 'obj', 'stl', 'fbx', 'ply'];

const modelUploadSchema = z.object({
  partId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('model') as File;
    const partId = formData.get('partId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!partId) {
      return NextResponse.json({ error: 'Part ID is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 40MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_FORMATS.includes(fileExtension)) {
      return NextResponse.json(
        { 
          error: `Invalid file format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`,
          allowedFormats: ALLOWED_FORMATS
        },
        { status: 400 }
      );
    }

    // Check if user owns the part
    const part = await prisma.customPart.findFirst({
      where: {
        id: partId,
        user: { email: session.user.email }
      }
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found or unauthorized' }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', '3d-models');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${partId}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);
    const publicPath = `/uploads/3d-models/${fileName}`;

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update part in database
    const updatedPart = await prisma.customPart.update({
      where: { id: partId },
      data: {
        modelFile: publicPath,
        modelFormat: fileExtension,
        modelSize: file.size,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        modelFile: true,
        modelFormat: true,
        modelSize: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Model uploaded successfully',
      part: updatedPart,
      fileInfo: {
        originalName: file.name,
        size: file.size,
        sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        format: fileExtension,
        publicUrl: publicPath
      }
    });

  } catch (error) {
    console.error('Error uploading 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to upload 3D model' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve 3D model info for a part
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partId = searchParams.get('partId');

    if (!partId) {
      return NextResponse.json({ error: 'Part ID is required' }, { status: 400 });
    }

    const part = await prisma.customPart.findUnique({
      where: { id: partId },
      select: {
        id: true,
        name: true,
        modelFile: true,
        modelFormat: true,
        modelSize: true,
        isPublic: true,
        user: {
          select: {
            username: true,
            name: true
          }
        }
      }
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check if part is public or user has access
    const session = await getServerSession(authOptions);
    if (!part.isPublic && (!session?.user?.email || session.user.email !== part.user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      part: {
        id: part.id,
        name: part.name,
        hasModel: !!part.modelFile,
        modelFile: part.modelFile,
        modelFormat: part.modelFormat,
        modelSize: part.modelSize,
        modelSizeFormatted: part.modelSize ? `${(part.modelSize / 1024 / 1024).toFixed(2)}MB` : null,
        creator: part.user
      },
      uploadLimits: {
        maxSize: MAX_FILE_SIZE,
        maxSizeFormatted: '40MB',
        allowedFormats: ALLOWED_FORMATS
      }
    });

  } catch (error) {
    console.error('Error fetching 3D model info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch 3D model info' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove 3D model from a part
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partId = searchParams.get('partId');

    if (!partId) {
      return NextResponse.json({ error: 'Part ID is required' }, { status: 400 });
    }

    // Check if user owns the part
    const part = await prisma.customPart.findFirst({
      where: {
        id: partId,
        user: { email: session.user.email }
      }
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found or unauthorized' }, { status: 404 });
    }

    // Update part to remove model references
    const updatedPart = await prisma.customPart.update({
      where: { id: partId },
      data: {
        modelFile: null,
        modelFormat: null,
        modelSize: null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        updatedAt: true
      }
    });

    // Note: We're not deleting the actual file from disk for safety
    // This could be implemented as a cleanup job later

    return NextResponse.json({
      message: 'Model removed successfully',
      part: updatedPart
    });

  } catch (error) {
    console.error('Error removing 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to remove 3D model' },
      { status: 500 }
    );
  }
}
