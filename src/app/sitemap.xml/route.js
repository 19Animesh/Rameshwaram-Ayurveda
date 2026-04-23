import { NextResponse } from 'next/server';

/**
 * GET /sitemap.xml
 * Dynamically generates a sitemap from the database so new products
 * are automatically included.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rameshwaramayurveda.com';

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/products', priority: '0.9', changefreq: 'daily' },
    { url: '/cart', priority: '0.5', changefreq: 'weekly' },
    { url: '/auth/login', priority: '0.4', changefreq: 'monthly' },
    { url: '/auth/register', priority: '0.4', changefreq: 'monthly' },
  ];

  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${baseUrl}${p.url}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`).join('');

  let productUrls = '';
  try {
    const connectToDatabase = (await import('@/lib/mongodb')).default;
    const Product = (await import('@/models/Product')).default;
    await connectToDatabase();
    const products = await Product.find({}).select('_id').lean();
    productUrls = products.map(p => `
  <url>
    <loc>${baseUrl}/products/${p._id}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`).join('');
  } catch(e) { console.error('sitemap products fetch failed', e); }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${productUrls}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
