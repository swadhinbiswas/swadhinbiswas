import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const accountId = import.meta.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME;
const publicUrl = import.meta.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});

export async function uploadImage(
    file: string,
    options: {
        folder?: string;
        public_id?: string;
        overwrite?: boolean;
        resource_type?: string;
    } = {}
) {
    try {
        // Parse data URI
        const match = file.match(/^data:(.+);base64,(.+)$/);
        if (!match) throw new Error('Invalid file format. Expected base64 data URI.');

        const contentType = match[1];
        const buffer = Buffer.from(match[2], 'base64');

        // Determine Key
        let key = options.public_id;

        if (!key) {
             const randomId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
             key = options.folder ? `${options.folder}/${randomId}` : randomId;
        }

        // Ensure extension
        // If the key doesn't have an extension, add one based on mime type
        if (!key.split('/').pop()?.includes('.')) {
             const ext = contentType.split('/')[1]?.replace('svg+xml', 'svg');
             if (ext) key += `.${ext}`;
        }

        // Check existence if overwrite is false
        if (options.overwrite === false) {
             try {
                 await S3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
                 const url = publicUrl ? `${publicUrl}/${key}` : key;
                 return {
                     success: true,
                     url: url,
                     public_id: key,
                 };
             } catch (error: any) {
                 // If error is not 'NotFound', throw it
                 // S3 Client throws an error with name 'NotFound' or '$metadata.httpStatusCode === 404'
                 if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
                     throw error;
                 }
                 // If 404, proceed to upload
             }
        }

        await S3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));

        const url = publicUrl ? `${publicUrl}/${key}` : key;

        return {
            success: true,
            url: url,
            public_id: key,
        };

    } catch (error) {
        console.error('R2 upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

export async function deleteImage(publicId: string) {
    try {
        await S3.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: publicId,
        }));
        return { success: true };
    } catch (error) {
        console.error('R2 delete error:', error);
        return { success: false };
    }
}

// Stub for backward compatibility if needed, though we plan to remove usage
export function getOptimizedUrl(publicId: string) {
    const url = publicUrl ? `${publicUrl}/${publicId}` : publicId;
    return url;
}
