import { v2 as cloudinary } from 'cloudinary';

// Parse Cloudinary URL from environment
// Astro uses import.meta.env for both client and server
const cloudinaryUrl = import.meta.env.CLOUDINARY_URL || process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
    // Parse cloudinary://api_key:api_secret@cloud_name
    const matches = cloudinaryUrl.match(/cloudinary:\/\/(.+):(.+)@(.+)/);

    if (matches) {
        const [, api_key, api_secret, cloud_name] = matches;

        cloudinary.config({
            cloud_name,
            api_key,
            api_secret,
            secure: true
        });
    } else {
        console.error('[Cloudinary] Invalid CLOUDINARY_URL format');
    }
} else {
    // Silent in production/missing env
}

export { cloudinary };

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or data URI
 * @param options - Upload options (folder, public_id, etc.)
 */
export async function uploadImage(
    file: string,
    options: {
        folder?: string;
        public_id?: string;
        overwrite?: boolean;
        resource_type?: 'image' | 'raw' | 'video' | 'auto';
    } = {}
) {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: options.folder || 'portfolio',
            public_id: options.public_id,
            overwrite: options.overwrite ?? true,
            resource_type: options.resource_type || 'auto',
        });

        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Generate optimized Cloudinary URL
 * @param publicId - Cloudinary public ID
 * @param transformations - Transformation options
 */
export function getOptimizedUrl(
    publicId: string,
    transformations: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string | number;
        format?: string;
    } = {}
) {
    return cloudinary.url(publicId, {
        ...transformations,
        secure: true,
        fetch_format: transformations.format || 'auto',
        quality: transformations.quality || 'auto',
    });
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function deleteImage(publicId: string) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return { success: result.result === 'ok' };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false };
    }
}
