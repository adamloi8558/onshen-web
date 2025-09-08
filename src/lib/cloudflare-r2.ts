import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client configuration for Cloudflare R2
export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
export const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

export interface PresignedUrlConfig {
  key: string;
  contentType: string;
  maxSize?: number;
  expiresIn?: number;
}

export async function generatePresignedUploadUrl({
  key,
  contentType,
  maxSize = 100 * 1024 * 1024, // 100MB default
  expiresIn = 3600, // 1 hour default
}: PresignedUrlConfig): Promise<{
  uploadUrl: string;
  fileUrl: string;
  key: string;
}> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSize,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `${PUBLIC_URL}/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
  };
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function getFileUrl(key: string): Promise<string> {
  return `${PUBLIC_URL}/${key}`;
}

export function parseFileSize(sizeString: string): number {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };

  const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) {
    throw new Error('Invalid file size format');
  }

  const [, size, unit] = match;
  return parseFloat(size) * units[unit.toUpperCase()];
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;

  return allowedTypes.some(type => {
    if (type.startsWith('.')) {
      return type.toLowerCase() === `.${extension}`;
    }
    // MIME type check
    const mimeExtensions: Record<string, string[]> = {
      'video/mp4': ['mp4'],
      'video/webm': ['webm'],
      'video/mkv': ['mkv'],
      'video/x-matroska': ['mkv'], // Additional MIME type for MKV
      'application/x-matroska': ['mkv'], // Another MKV MIME type
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    };
    
    return mimeExtensions[type]?.includes(extension) || false;
  });
}

export function generateUploadKey(
  userId: string, 
  fileType: 'video' | 'avatar' | 'poster', 
  filename: string,
  contentTitle?: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  switch (fileType) {
    case 'avatar':
      return `uploads/avatars/${userId}/${timestamp}_${sanitizedFilename}`;
    case 'poster':
      if (contentTitle) {
        const sanitizedTitle = contentTitle.replace(/[^a-zA-Z0-9\u0E00-\u0E7F.-]/g, '_');
        return `uploads/posters/${sanitizedTitle}/${timestamp}_${sanitizedFilename}`;
      }
      return `uploads/posters/${userId}/${timestamp}_${sanitizedFilename}`;
    case 'video':
      if (contentTitle) {
        const sanitizedTitle = contentTitle.replace(/[^a-zA-Z0-9\u0E00-\u0E7F.-]/g, '_');
        return `uploads/videos/${sanitizedTitle}/${timestamp}_${sanitizedFilename}`;
      }
      return `uploads/videos/${userId}/${timestamp}_${sanitizedFilename}`;
    default:
      return `uploads/misc/${userId}/${timestamp}_${sanitizedFilename}`;
  }
}