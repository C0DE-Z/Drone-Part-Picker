import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB
const ALLOWED_TYPES = ['.stl', '.obj', '.gltf', '.glb', '.3mf', '.ply'];
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', '3d-models');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }
  
  // Check file type
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(extension)) {
    return {
      isValid: false,
      error: `Unsupported file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }
  
  return { isValid: true };
}

function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const extension = '.' + originalName.split('.').pop()?.toLowerCase();
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${userId}_${timestamp}_${baseName}${extension}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (type !== '3d-model') {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const fileName = generateFileName(file.name, session.user.id || 'unknown');
    const filePath = join(UPLOAD_DIR, fileName);

    // Convert File to ArrayBuffer and then to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/3d-models/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'No file name provided' }, { status: 400 });
    }

    // Security check: ensure the filename contains the user's ID
    const userId = session.user.id || 'unknown';
    if (!fileName.startsWith(userId)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 });
    }

    const filePath = join(UPLOAD_DIR, fileName);
    
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
