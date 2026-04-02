/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow all remote image domains (Cloudinary, local CDNs, etc.)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow any https image source
      },
    ],
    // Also allow unoptimized local images served from /public
    unoptimized: false,
  },
};

export default nextConfig;
