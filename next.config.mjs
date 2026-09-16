/** @type {import('next').NextConfig} */

/**
 * Security headers.
 *
 * WHY THESE WERE ADDED
 * --------------------
 * The site handles logins, addresses and payments but sent no security
 * headers at all. These are the baseline set an e-commerce site is expected
 * to have; they cost nothing and close off clickjacking, MIME sniffing and
 * referrer leakage. A Content-Security-Policy is deliberately NOT enabled by
 * default because Razorpay's checkout injects scripts and iframes — a
 * ready-to-use CSP is provided, commented, in FUTURE_FEATURES.js.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig = {
  reactStrictMode: true,

  // Do not advertise the framework version to attackers.
  poweredByHeader: false,

  compress: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    // Product cards render at ~400px; serving these widths avoids generating
    // and caching desktop-sized variants that are never used.
    imageSizes: [64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  async redirects() {
    return [
      // Both spellings were used across the codebase and marketing links.
      { source: '/terms', destination: '/terms-and-conditions', permanent: true },
      { source: '/privacy', destination: '/privacy-policy', permanent: true },
    ];
  },
};

export default nextConfig;
