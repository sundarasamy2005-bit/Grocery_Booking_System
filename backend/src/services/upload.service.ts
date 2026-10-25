import fs from 'fs';
import path from 'path';
import streamifier from 'streamifier';
import { cloudinary } from '../config/cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

const isCloudinaryConfigured = (): boolean => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return !!(
    cloudName &&
    apiKey &&
    apiSecret &&
    !cloudName.startsWith('your_') &&
    !apiKey.startsWith('your_') &&
    !apiSecret.startsWith('your_')
  );
};

const saveToLocalStorage = async (
  buffer: Buffer,
  subfolder: string,
  mimetype: string = 'image/jpeg'
): Promise<CloudinaryUploadResult> => {
  const ext = mimetype.includes('png')
    ? 'png'
    : mimetype.includes('webp')
    ? 'webp'
    : 'jpg';

  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const targetDir = path.join(process.cwd(), 'uploads', subfolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, filename);
  await fs.promises.writeFile(filePath, buffer);

  const port = process.env.PORT || 5000;
  const hostUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  const url = `${hostUrl}/uploads/${subfolder}/${filename}`;

  return {
    url,
    publicId: `local-${subfolder}-${filename}`,
  };
};

const uploadWithFallback = async (
  buffer: Buffer,
  folder: string,
  mimetype: string = 'image/jpeg',
  publicId?: string
): Promise<CloudinaryUploadResult> => {
  const cleanSubfolder = folder.replace('grocery/', '');

  if (isCloudinaryConfigured()) {
    try {
      return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const options: Record<string, unknown> = {
          folder,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, crop: 'limit' },
          ],
        };

        if (publicId && !publicId.startsWith('local-')) {
          options.public_id = publicId;
          options.overwrite = true;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Cloudinary upload failed'));
              return;
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary upload failed, falling back to local disk storage:', cloudErr);
      return saveToLocalStorage(buffer, cleanSubfolder, mimetype);
    }
  }

  // Cloudinary not configured -> save to local disk
  return saveToLocalStorage(buffer, cleanSubfolder, mimetype);
};

export const uploadService = {
  uploadWithFallback,

  async uploadProductImage(
    buffer: Buffer,
    mimetype?: string,
    existingPublicId?: string
  ): Promise<CloudinaryUploadResult> {
    return uploadWithFallback(buffer, 'grocery/products', mimetype || 'image/jpeg', existingPublicId);
  },

  async uploadReviewPhoto(
    buffer: Buffer,
    mimetype?: string
  ): Promise<CloudinaryUploadResult> {
    return uploadWithFallback(buffer, 'grocery/reviews', mimetype || 'image/jpeg');
  },

  async uploadShopImage(
    buffer: Buffer,
    mimetype?: string,
    existingPublicId?: string
  ): Promise<CloudinaryUploadResult> {
    return uploadWithFallback(buffer, 'grocery/shops', mimetype || 'image/jpeg', existingPublicId);
  },

  async uploadProfileImage(
    buffer: Buffer,
    mimetype?: string,
    existingPublicId?: string
  ): Promise<CloudinaryUploadResult> {
    return uploadWithFallback(buffer, 'grocery/profiles', mimetype || 'image/jpeg', existingPublicId);
  },

  async uploadCategoryImage(
    buffer: Buffer,
    mimetype?: string
  ): Promise<CloudinaryUploadResult> {
    return uploadWithFallback(buffer, 'grocery/categories', mimetype || 'image/jpeg');
  },

  async deleteImage(publicId: string): Promise<void> {
    if (!publicId) return;
    if (publicId.startsWith('local-')) {
      try {
        const parts = publicId.split('-');
        if (parts.length >= 3) {
          const subfolder = parts[1];
          const filename = parts.slice(2).join('-');
          const filePath = path.join(process.cwd(), 'uploads', subfolder, filename);
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        }
      } catch (err) {
        console.warn('Failed to delete local image:', err);
      }
      return;
    }

    if (isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️  Cloudinary image deleted: ${publicId}`);
      } catch (error) {
        console.error('❌ Failed to delete Cloudinary image:', error);
      }
    }
  },

  getThumbnailUrl(url: string, width = 400): string {
    if (!url || !url.includes('cloudinary')) return url;
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  },
};
