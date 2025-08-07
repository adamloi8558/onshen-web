import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db, upload_jobs, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { 
  addVideoProcessingJob, 
  addAvatarProcessingJob, 
  addPosterProcessingJob,
  VideoUploadJobData,
  AvatarUploadJobData,
  PosterUploadJobData
} from '@/lib/queue';

const completeUploadSchema = z.object({
  jobId: z.string().min(1, 'กรุณาระบุ Job ID'),
  fileUrl: z.string().url('URL ไฟล์ไม่ถูกต้อง'),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await requireAuth();
    
    const body = await request.json();
    const validatedData = completeUploadSchema.parse(body);

    // Get upload job
    const [uploadJob] = await db
      .select()
      .from(upload_jobs)
      .where(eq(upload_jobs.job_id, validatedData.jobId))
      .limit(1);

    if (!uploadJob) {
      return NextResponse.json(
        { error: 'ไม่พบงานอัปโหลดที่ระบุ' },
        { status: 404 }
      );
    }

    // Check ownership
    if (uploadJob.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงงานอัปโหลดนี้' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (uploadJob.status !== 'pending') {
      return NextResponse.json(
        { error: 'งานอัปโหลดนี้ถูกประมวลผลแล้ว' },
        { status: 400 }
      );
    }

    // Verify file URL matches
    if (uploadJob.upload_url !== validatedData.fileUrl) {
      return NextResponse.json(
        { error: 'URL ไฟล์ไม่ตรงกับที่ลงทะเบียนไว้' },
        { status: 400 }
      );
    }

    // Update upload job status
    await db
      .update(upload_jobs)
      .set({
        status: 'uploaded',
        progress: 5,
        updated_at: new Date(),
      })
      .where(eq(upload_jobs.job_id, validatedData.jobId));

    // Add processing job to queue based on file type
    let queueJobId: string;

    switch (uploadJob.file_type) {
      case 'video':
        const videoJobData: VideoUploadJobData = {
          jobId: uploadJob.job_id,
          userId: uploadJob.user_id,
          contentId: uploadJob.content_id || undefined,
          episodeId: uploadJob.episode_id || undefined,
          originalFilename: uploadJob.original_filename,
          fileSize: uploadJob.file_size,
          uploadPath: uploadJob.upload_url!,
        };
        queueJobId = await addVideoProcessingJob(videoJobData);
        break;

      case 'avatar':
        // Get current avatar for deletion
        const [currentUser] = await db
          .select({ avatar_url: users.avatar_url })
          .from(users)
          .where(eq(users.id, uploadJob.user_id))
          .limit(1);

        const avatarJobData: AvatarUploadJobData = {
          jobId: uploadJob.job_id,
          userId: uploadJob.user_id,
          originalFilename: uploadJob.original_filename,
          fileSize: uploadJob.file_size,
          uploadPath: uploadJob.upload_url!,
          oldAvatarPath: currentUser?.avatar_url || undefined,
        };
        queueJobId = await addAvatarProcessingJob(avatarJobData);
        break;

      case 'poster':
        if (!uploadJob.content_id) {
          return NextResponse.json(
            { error: 'ไม่พบ Content ID สำหรับการอัปโหลดโปสเตอร์' },
            { status: 400 }
          );
        }

        const posterJobData: PosterUploadJobData = {
          jobId: uploadJob.job_id,
          userId: uploadJob.user_id,
          contentId: uploadJob.content_id,
          originalFilename: uploadJob.original_filename,
          fileSize: uploadJob.file_size,
          uploadPath: uploadJob.upload_url!,
        };
        queueJobId = await addPosterProcessingJob(posterJobData);
        break;

      default:
        return NextResponse.json(
          { error: 'ประเภทไฟล์ไม่ถูกต้อง' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        jobId: uploadJob.job_id,
        queueJobId,
        status: 'uploaded',
        message: 'อัปโหลดไฟล์สำเร็จ กำลังประมวลผล...',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Complete upload error:', error);

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

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}