import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Validates image before upload
 * @param {string} fileData - Base64 or URL
 * @throws {Error} if invalid
 */
function validateImage(fileData) {
  if (!fileData) throw new Error('No image data provided');
  
  // Basic size check for base64
  if (fileData.startsWith('data:image/')) {
    const sizeInBytes = (fileData.length * (3/4)) - (fileData.endsWith('==') ? 2 : 1);
    if (sizeInBytes > 2 * 1024 * 1024) {
      throw new Error('Image size exceeds 2MB limit');
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const mimeType = fileData.match(/data:([^;]+);/)?.[1];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.');
    }
  }
}

/**
 * Uploads an image to Cloudinary
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadImage(fileData, folder = 'ayurveda_products', publicId = null) {
  validateImage(fileData);
  
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
    };
    if (publicId) uploadOptions.public_id = publicId;

    const uploadResponse = await cloudinary.uploader.upload(fileData, uploadOptions);
    
    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Failed to upload image to Cloudinary: ' + error.message);
  }
}

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId 
 */
export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    // Don't throw, just log. Deletion failure shouldn't break the app flow usually.
  }
}

/**
 * Optimizes Cloudinary URL with auto-format, auto-quality, and optional sizing
 */
export function optimizeImageUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  const { width, height, crop = 'fill', gravity = 'auto' } = options;
  
  let transformations = 'f_auto,q_auto,dpr_auto';
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (width || height) transformations += `,c_${crop},g_${gravity}`;

  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformations}/`);
  }
  return url;
}

/**
 * Generates an LQIP (Low Quality Image Placeholder) URL
 */
export function getBlurUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  // w_50,blur_1000 for a tiny highly blurred base
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_50,e_blur:1000/');
}

export default cloudinary;
