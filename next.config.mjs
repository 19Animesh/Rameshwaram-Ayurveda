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
    ],
    // Also allow unoptimized local images served from /public
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-eval required by Razorpay checkout SDK (uses eval internally)
              // va.vercel-scripts.com required for Vercel Analytics
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' checkout.razorpay.com www.gstatic.com va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              // blob: needed for image upload previews (URL.createObjectURL)
              "img-src 'self' data: blob: res.cloudinary.com",
              // *.razorpay.com covers lumberjack, checkout, api subdomains
              // Firebase identity toolkit needed for phone OTP
              // Vercel Analytics and Insights for performance tracking
              "connect-src 'self' *.razorpay.com api.postalpincode.in *.googleapis.com *.firebase.com *.firebaseio.com vitals.vercel-insights.com",
              // Razorpay payment modal renders inside an iframe
              "frame-src 'self' *.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
