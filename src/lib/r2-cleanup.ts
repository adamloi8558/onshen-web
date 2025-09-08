import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

export async function deleteFileFromR2(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl) return true;

    // Extract key from URL
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
    const key = fileUrl.replace(publicUrl + '/', '');
    
    if (!key || key === fileUrl) {
      console.warn('Invalid file URL for deletion:', fileUrl);
      return false;
    }

    console.log('Deleting file from R2:', key);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log('File deleted successfully:', key);
    return true;

  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
}

export async function deleteContentFilesFromR2(contentId: string): Promise<boolean> {
  try {
    // List all files for this content ID
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `uploads/videos/${contentId}/`,
    });

    const listResult = await s3Client.send(listCommand);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('No video files found for content:', contentId);
    } else {
      // Delete all video files
      const deletePromises = listResult.Contents.map(async (object) => {
        if (!object.Key) return;
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        await s3Client.send(deleteCommand);
        console.log('Deleted video file:', object.Key);
      });

      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} video files for content: ${contentId}`);
    }
    
    // Also delete poster files
    const posterListCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `uploads/posters/${contentId}/`,
    });

    const posterListResult = await s3Client.send(posterListCommand);
    
    if (posterListResult.Contents && posterListResult.Contents.length > 0) {
      const posterDeletePromises = posterListResult.Contents.map(async (object) => {
        if (!object.Key) return;
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        await s3Client.send(deleteCommand);
        console.log('Deleted poster file:', object.Key);
      });

      await Promise.all(posterDeletePromises);
      console.log(`Deleted ${posterDeletePromises.length} poster files for content: ${contentId}`);
    }

    return true;

  } catch (error) {
    console.error('Error deleting content files from R2:', error);
    return false;
  }
}

export async function deleteVideoFromR2(contentId: string): Promise<boolean> {
  try {
    // List all video files for this content ID
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `uploads/videos/${contentId}/`,
    });

    const listResult = await s3Client.send(listCommand);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log('No video files found for content:', contentId);
      return true;
    }

    // Delete all video files only
    const deletePromises = listResult.Contents.map(async (object) => {
      if (!object.Key) return;
      
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: object.Key,
      });

      await s3Client.send(deleteCommand);
      console.log('Deleted video file:', object.Key);
    });

    await Promise.all(deletePromises);
    console.log(`Deleted ${deletePromises.length} video files for content: ${contentId}`);

    return true;

  } catch (error) {
    console.error('Error deleting video files from R2:', error);
    return false;
  }
}