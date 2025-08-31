import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { 
  generatePresignedUploadUrl, 
  validateFileType, 
  parseFileSize, 
  generateUploadKey 
} from '@/lib/cloudflare-r2';

export const dynamic = 'force-dynamic';

const posterUploadSchema = z.object({
  filename: z.string().min(1, 'กรุณาระบุชื่อไฟล์'),
  fileSize: z.number().min(1, 'ขนาดไฟล์ไม่ถูกต้อง'),
  fileType: z.literal('poster'),
  contentType: z.string().min(1, 'กรุณาระบุ Content Type'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== Test Poster Upload API Start ===');
    
    // Authentication check
    const user = await requireAuth();
    console.log('User authenticated:', { id: user.id, role: user.role });

    const body = await request.json();
    console.log('Poster upload request body:', JSON.stringify(body, null, 2));
    
    const validatedData = posterUploadSchema.parse(body);
    console.log('Validated poster data:', JSON.stringify(validatedData, null, 2));

    // Validate image file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = parseFileSize('10MB');
    
    console.log('Poster validation config:', {
      filename: validatedData.filename,
      allowedTypes,
      maxSizeMB: maxSize / 1024 / 1024
    });
    
    if (!validateFileType(validatedData.filename, allowedTypes)) {
      console.log('Poster file type validation failed');
      return NextResponse.json(
        { 
          error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น',
          details: `ไฟล์ ${validatedData.filename} ไม่ใช่ไฟล์ภาพที่รองรับ`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (validatedData.fileSize > maxSize) {
      return NextResponse.json(
        { error: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)` },
        { status: 400 }
      );
    }

    // Generate upload key for poster
    const uploadKey = generateUploadKey(user.id, 'poster', validatedData.filename);
    console.log('Generated poster upload key:', uploadKey);
    
    // Generate presigned URL
    console.log('Generating presigned URL for poster...');
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl({
      key: uploadKey,
      contentType: validatedData.contentType,
      maxSize: validatedData.fileSize,
      expiresIn: 3600, // 1 hour
    });
    console.log('Poster presigned URL generated successfully');

    console.log('=== Test Poster Upload API Success ===');
    
    return NextResponse.json({
      success: true,
      message: 'Poster upload ready',
      data: {
        uploadUrl,
        fileUrl,
        key: uploadKey,
        expiresIn: 3600,
        validation: {
          fileType: 'poster',
          allowedTypes,
          maxSize: '10MB',
          fileSize: `${(validatedData.fileSize / 1024 / 1024).toFixed(2)}MB`
        }
      }
    });

  } catch (error) {
    console.error('=== Test Poster Upload API Error ===', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการเตรียมอัปโหลดภาพปก',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}