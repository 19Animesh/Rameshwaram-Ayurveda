'use client';

/**
 * ProductSkeleton — shimmer loading placeholder that matches ProductCard layout.
 * Usage: render N of these while products are loading.
 */
export default function ProductSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line xshort" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line xshort" />
            <div className="skeleton skeleton-btn" />
          </div>
        </div>
      ))}
    </>
  );
}
