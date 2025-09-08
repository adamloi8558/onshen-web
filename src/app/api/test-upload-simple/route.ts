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

const testUploadSchema = z.object({
  filename: z.string().min(1, 'กรุณาระบุชื่อไฟล์'),
  fileSize: z.number().min(1, 'ขนาดไฟล์ไม่ถูกต้อง'),
  fileType: z.enum(['video', 'avatar', 'poster']),
  contentType: z.string().min(1, 'กรุณาระบุ Content Type'),
  contentId: z.string().optional(),
  episodeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== Test Upload API Start ===');
    
    // Authentication check
    const user = await requireAuth();
    console.log('User authenticated:', { id: user.id, role: user.role });

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const validatedData = testUploadSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Validate file type based on upload type
    let allowedTypes: string[];
    let maxSize: number;
    
    if (validatedData.fileType === 'poster') {
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      maxSize = parseFileSize('10MB');
    } else if (validatedData.fileType === 'avatar') {
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      maxSize = parseFileSize('5MB');
    } else {
      allowedTypes = ['video/mp4', 'video/webm', 'video/mkv', 'video/x-matroska', 'application/x-matroska'];
      maxSize = parseFileSize('5GB');
    }
    
    console.log('File validation config:', {
      filename: validatedData.filename,
      fileType: validatedData.fileType,
      allowedTypes,
      maxSizeGB: maxSize / 1024 / 1024 / 1024
    });
    
    if (!validateFileType(validatedData.filename, allowedTypes)) {
      console.log('File type validation failed');
      return NextResponse.json(
        { 
          error: 'ประเภทไฟล์ไม่ได้รับอนุญาต',
          details: `ไฟล์ ${validatedData.filename} ไม่ตรงกับประเภทที่รองรับ: ${allowedTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (validatedData.fileSize > maxSize) {
      const maxSizeText = validatedData.fileType === 'poster' ? '10MB' : 
                          validatedData.fileType === 'avatar' ? '5MB' : '5GB';
      return NextResponse.json(
        { error: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSizeText})` },
        { status: 400 }
      );
    }

    // Generate upload key
    const uploadKey = generateUploadKey(user.id, validatedData.fileType, validatedData.filename, validatedData.contentId);
    console.log('Generated upload key:', uploadKey);
    
    // Generate presigned URL
    console.log('Generating presigned URL...');
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl({
      key: uploadKey,
      contentType: validatedData.contentType,
      maxSize: validatedData.fileSize,
      expiresIn: 3600, // 1 hour
    });
    console.log('Presigned URL generated successfully');

    console.log('=== Test Upload API Success ===');
    
    return NextResponse.json({
      success: true,
      message: 'Test upload API working',
      data: {
        uploadUrl,
        fileUrl,
        key: uploadKey,
        expiresIn: 3600,
        validation: {
          fileType: validatedData.fileType,
          allowedTypes,
          maxSize: `${maxSize / 1024 / 1024 / 1024}GB`,
          fileSize: `${validatedData.fileSize / 1024 / 1024}MB`
        }
      }
    });

  } catch (error) {
    console.error('=== Test Upload API Error ===', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการทดสอบ',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}