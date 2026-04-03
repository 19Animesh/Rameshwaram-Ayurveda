import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card fade-in" style={{ textAlign: 'center', maxWidth: '500px', padding: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '64px', fontWeight: 'bold', color: 'var(--primary-light)', opacity: 0.5, marginBottom: 'var(--space-md)' }}>404</div>
        <h2 style={{ color: 'var(--primary-dark)', marginBottom: 'var(--space-sm)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-lg)' }}>
          The medicinal remedy or page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/products" className="btn btn-primary">
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
