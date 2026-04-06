/**
 * Optimizes Cloudinary URL with auto-format, auto-quality, and optional sizing
 * This helper is safe to use in Client Components as it only performs string manipulation.
 */
export function optimizeImageUrl(url, options = {}) {
  if (!url || !url.startsWith('http')) return '';
  if (!url.includes('cloudinary.com')) return url;
  
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
  if (!url || !url.startsWith('http') || !url.includes('cloudinary.com')) return null;
  // w_50,blur_300 for a tiny highly blurred base
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_50,e_blur:300/');
}
