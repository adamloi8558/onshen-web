import { Queue } from 'bullmq';
import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

// Create Redis connection
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableOfflineQueue: false,
});

// Video processing queue
export const videoQueue = new Queue('video-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Image processing queue
export const imageQueue = new Queue('image-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job data interfaces
export interface VideoUploadJobData {
  jobId: string;
  userId: string;
  contentId?: string;
  episodeId?: string;
  originalFilename: string;
  fileSize: number;
  uploadPath: string;
}

export interface AvatarUploadJobData {
  jobId: string;
  userId: string;
  originalFilename: string;
  fileSize: number;
  uploadPath: string;
  oldAvatarPath?: string;
}

export interface PosterUploadJobData {
  jobId: string;
  userId: string;
  contentId: string;
  originalFilename: string;
  fileSize: number;
  uploadPath: string;
}

// Queue functions
export async function addVideoProcessingJob(data: VideoUploadJobData): Promise<string> {
  console.log('📹 Adding video processing job to queue:', {
    jobId: data.jobId,
    contentId: data.contentId,
    episodeId: data.episodeId,
    uploadPath: data.uploadPath,
  });

  const job = await videoQueue.add('process-video', data, {
    jobId: data.jobId,
    priority: 1,
  });

  console.log('✅ Video job added to queue successfully:', {
    queueJobId: job.id,
    jobId: data.jobId,
  });

  return job.id!;
}

export async function addAvatarProcessingJob(data: AvatarUploadJobData): Promise<string> {
  const job = await imageQueue.add('process-avatar', data, {
    jobId: data.jobId,
    priority: 10, // Higher priority for avatars
  });

  return job.id!;
}

export async function addPosterProcessingJob(data: PosterUploadJobData): Promise<string> {
  const job = await imageQueue.add('process-poster', data, {
    jobId: data.jobId,
    priority: 5,
  });

  return job.id!;
}

// Get job status
export async function getJobStatus(jobId: string, queueType: 'video' | 'image') {
  const queue = queueType === 'video' ? videoQueue : imageQueue;
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    returnvalue: job.returnvalue,
  };
}

// Clean up completed jobs
export async function cleanupQueues(): Promise<void> {
  await videoQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean completed jobs older than 24 hours
  await videoQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed'); // Clean failed jobs older than 7 days
  
  await imageQueue.clean(24 * 60 * 60 * 1000, 200, 'completed');
  await imageQueue.clean(7 * 24 * 60 * 60 * 1000, 100, 'failed');
}

// Health check
export async function checkQueueHealth(): Promise<{ video: boolean; image: boolean; redis: boolean }> {
  try {
    const [videoPing, imagePing, redisPing] = await Promise.all([
      videoQueue.isPaused(),
      imageQueue.isPaused(),
      redis.ping(),
    ]);

    return {
      video: videoPing !== undefined,
      image: imagePing !== undefined,
      redis: redisPing === 'PONG',
    };
  } catch (err) {
    console.error('Queue health check failed:', err);
    return {
      video: false,
      image: false,
      redis: false,
    };
  }
}