import { v2 as cloudinary } from 'cloudinary';

export const initializeCloudinary = (): void => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const hasPlaceholder = [cloudName, apiKey, apiSecret].some((value) =>
    !value || /^your_(cloud_name|api_key|api_secret)$/.test(value),
  );

  if (hasPlaceholder) {
    console.warn('⚠️  Cloudinary credentials not set — image uploads will fail');
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log('✅ Cloudinary initialized');
};

export { cloudinary };
