'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="error-card card fade-in" style={{ textAlign: 'center', maxWidth: '500px', padding: 'var(--space-2xl)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>⚠️</div>
        <h2 style={{ color: 'var(--primary-dark)', marginBottom: 'var(--space-sm)' }}>Something went wrong!</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-lg)' }}>
          We apologize for the inconvenience. A temporary error occurred while loading this page.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <button 
            onClick={() => reset()} 
            className="btn btn-primary"
          >
            Try Again
          </button>
          <Link href="/" className="btn btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
