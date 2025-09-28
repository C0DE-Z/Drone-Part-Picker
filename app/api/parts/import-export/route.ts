import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateMultipleFields } from '@/utils/profanityFilter';
import { z } from 'zod';

const importSchema = z.object({
  parts: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    category: z.string().min(1).max(50),
    specifications: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    isPublic: z.boolean().optional()
  })).min(1).max(50) // Max 50 parts per import
});

// Export user's custom parts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const publicOnly = searchParams.get('public') === 'true';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where = {
      userId: user.id,
      ...(publicOnly && { isPublic: true })
    };

    const parts = await prisma.customPart.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        specifications: true,
        isPublic: true,
        modelFile: true,
        modelFormat: true,
        modelSize: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.username || user.name || user.email,
      totalParts: parts.length,
      parts: parts.map(part => ({
        name: part.name,
        description: part.description,
        category: part.category,
        specifications: part.specifications,
        isPublic: part.isPublic,
        hasModel: !!part.modelFile,
        modelFormat: part.modelFormat,
        modelSize: part.modelSize,
        viewCount: part.viewCount,
        createdAt: part.createdAt.toISOString(),
        updatedAt: part.updatedAt.toISOString()
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Name',
        'Description', 
        'Category',
        'Specifications',
        'Public',
        'Has Model',
        'Model Format',
        'View Count',
        'Created At'
      ];
      
      const csvRows = parts.map(part => [
        `"${part.name}"`,
        `"${part.description || ''}"`,
        `"${part.category}"`,
        `"${JSON.stringify(part.specifications).replace(/"/g, '""')}"`,
        part.isPublic ? 'Yes' : 'No',
        part.modelFile ? 'Yes' : 'No',
        `"${part.modelFormat || ''}"`,
        part.viewCount.toString(),
        `"${part.createdAt.toISOString()}"`
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="custom-parts-${Date.now()}.csv"`
        }
      });
    }

    // Default JSON format
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="custom-parts-${Date.now()}.json"`
      }
    });

  } catch (error) {
    console.error('Error exporting custom parts:', error);
    return NextResponse.json({ error: 'Failed to export parts' }, { status: 500 });
  }
}

// Import custom parts
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = importSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid import data', 
          details: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { parts } = validation.data;
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ part: string; error: string }>
    };

    // Process each part
    for (const partData of parts) {
      try {
        // Content filtering
        const fieldsToValidate: Record<string, string> = {
          name: partData.name,
          category: partData.category
        };
        
        if (partData.description) {
          fieldsToValidate.description = partData.description;
        }

        // Add specifications to validation
        if (partData.specifications) {
          Object.entries(partData.specifications).forEach(([key, value]) => {
            if (typeof value === 'string') {
              fieldsToValidate[`spec_${key}`] = value;
            }
          });
        }

        const contentValidation = validateMultipleFields(fieldsToValidate, {
          allowMildProfanity: false,
          blockHighSeverity: true
        });

        if (!contentValidation.isValid) {
          results.failed++;
          results.errors.push({
            part: partData.name,
            error: `Content validation failed: ${Array.isArray(contentValidation.messages) ? contentValidation.messages.join(', ') : 'Invalid content'}`
          });
          continue;
        }

        // Check for duplicate names (for this user)
        const existingPart = await prisma.customPart.findFirst({
          where: {
            name: partData.name,
            userId: user.id
          }
        });

        if (existingPart) {
          results.failed++;
          results.errors.push({
            part: partData.name,
            error: 'Part with this name already exists'
          });
          continue;
        }

        // Create the part
        await prisma.customPart.create({
          data: {
            name: partData.name,
            description: partData.description,
            category: partData.category,
            specifications: (partData.specifications || {}) as object,
            isPublic: partData.isPublic || false,
            userId: user.id
          }
        });

        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          part: partData.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.success} parts imported successfully, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    console.error('Error importing custom parts:', error);
    return NextResponse.json({ error: 'Failed to import parts' }, { status: 500 });
  }
}