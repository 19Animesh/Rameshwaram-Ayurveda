'use client';
/**
 * HomeFeatured — Client Component
 * Renders the Featured Products grid server-side rendered data.
 * Kept as a client component because ProductCard uses useCart hook.
 */
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function HomeFeatured({ featured = [] }) {
  return (
    <section className="section" style={{ background: 'var(--green-50)' }}>
      <div className="container">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Hand-picked Ayurvedic medicines recommended by our experts</p>
          <div className="section-line"></div>
        </div>
        <div className="products-grid">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
          <Link href="/products" className="btn btn-primary btn-lg">
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
