import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { 
  generatePresignedUploadUrl, 
  validateFileType, 
  parseFileSize, 
  generateUploadKey 
} from '@/lib/cloudflare-r2';
import { db, upload_jobs } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const presignedUrlSchema = z.object({
  filename: z.string().min(1, 'กรุณาระบุชื่อไฟล์'),
  fileSize: z.number().min(1, 'ขนาดไฟล์ไม่ถูกต้อง'),
  fileType: z.enum(['video', 'avatar', 'poster'], {
    errorMap: () => ({ message: 'ประเภทไฟล์ไม่ถูกต้อง' })
  }),
  contentType: z.string().min(1, 'กรุณาระบุ Content Type'),
  contentId: z.string().optional(),
  episodeId: z.string().optional(),
});



export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await requireAuth();
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, 'upload');
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, 'upload');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'คุณอัปโหลดไฟล์บ่อยเกินไป กรุณาลองใหม่ในภายหลัง',
          blockedUntil: rateLimitResult.blockedUntil,
        },
        { 
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const body = await request.json();
    console.log('Upload request body:', JSON.stringify(body, null, 2));
    
    const validatedData = presignedUrlSchema.parse(body);
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
    
    console.log('File validation:', {
      filename: validatedData.filename,
      fileType: validatedData.fileType,
      allowedTypes,
      maxSize: `${maxSize / 1024 / 1024 / 1024}GB`
    });
    
    if (!validateFileType(validatedData.filename, allowedTypes)) {
      console.log('File type validation failed');
      return NextResponse.json(
        { 
          error: 'ประเภทไฟล์ไม่ได้รับอนุญาต',
          details: `ไฟล์ ${validatedData.filename} ไม่ตรงกับประเภทที่รองรับ: ${allowedTypes.join(', ')}`
        },
        { 
          status: 400,
          headers: rateLimitHeaders,
        }
      );
    }

    // Validate file size
    if (validatedData.fileSize > maxSize) {
      const maxSizeText = validatedData.fileType === 'poster' ? '10MB' : 
                          validatedData.fileType === 'avatar' ? '5MB' : '5GB';
      return NextResponse.json(
        { error: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${maxSizeText})` },
        { 
          status: 400,
          headers: rateLimitHeaders,
        }
      );
    }

    // Check permissions for content upload
    if ((validatedData.fileType === 'video' || validatedData.fileType === 'poster') && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์อัปโหลดไฟล์ประเภทนี้' },
        { 
          status: 403,
          headers: rateLimitHeaders,
        }
      );
    }

    // Generate upload key
    const uploadKey = generateUploadKey(user.id, validatedData.fileType, validatedData.filename);
    
    // Generate presigned URL
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl({
      key: uploadKey,
      contentType: validatedData.contentType,
      maxSize: validatedData.fileSize,
      expiresIn: 3600, // 1 hour
    });

    // Create upload job record
    const jobId = uuidv4();
    await db.insert(upload_jobs).values({
      job_id: jobId,
      user_id: user.id,
      content_id: validatedData.contentId,
      episode_id: validatedData.episodeId,
      file_type: validatedData.fileType,
      original_filename: validatedData.filename,
      file_size: validatedData.fileSize,
      upload_url: fileUrl,
      status: 'pending',
      progress: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const responseHeaders = new Headers(rateLimitHeaders);
    return NextResponse.json(
      {
        jobId,
        uploadUrl,
        fileUrl,
        key: uploadKey,
        expiresIn: 3600,
        message: 'สร้าง Presigned URL สำเร็จ',
      },
      { 
        status: 200,
        headers: responseHeaders,
      }
    );

  } catch (error) {
    console.error('Presigned URL error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}