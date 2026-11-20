/**
 * src/app/products/[id]/layout.js  (Server Component)
 *
 * Per-product <title>, description, link-preview tags and Product structured
 * data.
 *
 * WHY THIS EXISTS
 * ---------------
 * The product page is a client component that loads its data in the browser,
 * so every product URL used to share the store's generic title. Google results
 * and WhatsApp / Facebook link previews could not tell 350+ products apart.
 *
 * This layout renders on the server with the real product, and leaves the
 * existing interactive page (page.js) unchanged. It never throws: if the
 * product cannot be loaded, the page falls back to the store's default
 * metadata and the page itself shows its usual "not found" or retry message.
 *
 * Moving the whole page to server rendering (FUTURE_FEATURES.js, section 1)
 * would additionally put the product text into the first HTML response.
 */
import { cache } from 'react';
import { getProductById } from '@/services/productService';
import { getSiteUrl } from '@/lib/siteUrl';

// Re-read the product at most every five minutes, so price and stock in the
// structured data stay close to the live values.
export const revalidate = 300;

const STORE_NAME = 'Rameshwaram Ayurveda';

// generateMetadata and the layout both need the product; cache() makes it one
// database read per request.
const loadProduct = cache(async (id) => {
  try {
    return await getProductById(id);
  } catch (err) {
    console.error('[products/[id]/layout] could not load product for metadata:', err?.message);
    return null;
  }
});

function describe(product) {
  const text = (product.description || '').replace(/\s+/g, ' ').trim();
  const base = text || `Buy ${product.name} by ${product.brandName} online at ${STORE_NAME}.`;
  return base.length > 155 ? `${base.slice(0, 152).trimEnd()}…` : base;
}

export async function generateMetadata({ params }) {
  const product = await loadProduct(params.id);
  if (!product) {
    return { title: `Product — ${STORE_NAME}` };
  }

  const title = `${product.name} — ${product.brandName} | ${STORE_NAME}`;
  const description = describe(product);
  const images = product.imageUrl?.startsWith('http') ? [{ url: product.imageUrl, alt: product.name }] : [];

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      type: 'website',
      siteName: STORE_NAME,
      title,
      description,
      url: `/products/${product.id}`,
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };
}

function productJsonLd(product) {
  const inStock = Array.isArray(product.variants) && product.variants.length > 1
    ? product.variants.some((v) => (v.stock ?? 0) > 0)
    : (product.stock ?? 0) > 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.imageUrl?.startsWith('http') ? { image: product.imageUrl } : {}),
    brand: { '@type': 'Brand', name: product.brandName },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(product.price),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${getSiteUrl()}/products/${product.id}`,
    },
  };
}

export default async function ProductLayout({ children, params }) {
  const product = await loadProduct(params.id);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          // JSON.stringify output with "<" escaped cannot break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}
