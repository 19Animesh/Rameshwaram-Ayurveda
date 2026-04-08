'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { getProductEmoji, getStars, formatPrice, getDiscount } from '@/components/ProductCard';
import { optimizeImageUrl, getBlurUrl } from '@/lib/cloudinary-client';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(result => { setProduct(result.data?.product || result.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner" style={{ marginTop: '100px' }}></div>;
  if (!product) return (
    <div className="empty-state" style={{ marginTop: '100px' }}>
      <span className="empty-icon">😕</span>
      <h3>Product Not Found</h3>
      <p>The product you're looking for doesn't exist.</p>
      <Link href="/products" className="btn btn-primary">Browse Products</Link>
    </div>
  );

  const discount = getDiscount(product.originalPrice, product.price);
  const emoji = getProductEmoji(product.category);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const stockStatus = product.stock > 50 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock';
  const stockText = product.stock > 50 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock';

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a> <span>/</span> <a href="/products">Products</a> <span>/</span> <span>{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container product-detail">
        <div className="product-detail-grid">
          <div className="product-detail-image">
            {product.imageUrl && product.imageUrl.startsWith('http') && !imgFailed ? (
              <div style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', borderRadius: 'var(--radius-lg)', background: 'var(--green-50)' }}>
                {/* Blur Placeholder */}
                {!isLoaded && (
                  <img
                    src={getBlurUrl(product.imageUrl)}
                    alt=""
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      objectFit: 'contain',
                      filter: 'blur(30px)',
                      transform: 'scale(1.2)',
                    }}
                  />
                )}
                <img
                  src={optimizeImageUrl(product.imageUrl, { width: 800, height: 800 })}
                  alt={product.name}
                  onLoad={() => setIsLoaded(true)}
                  onError={() => setImgFailed(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out',
                  }}
                />
              </div>
            ) : (
              <span className="product-emoji-large">{emoji}</span>
            )}
          </div>

          <div className="product-detail-info">
            <div className="product-detail-brand">{product.brandName}</div>
            <h1>{product.name}</h1>
            
            <div className="product-card-rating" style={{ margin: 'var(--space-md) 0' }}>
              <span className="stars" style={{ fontSize: '18px' }}>{getStars(product.rating)}</span>
              <span className="rating-count" style={{ fontSize: '14px' }}>
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="product-detail-price">
              <span className="price-current">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="price-original">{formatPrice(product.originalPrice)}</span>
                  <span className="price-discount">{discount}% off</span>
                </>
              )}
            </div>

            <div className="detail-section">
              <h3>📋 Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="detail-section">
              <h3>💊 Dosage</h3>
              <p>{product.dosage}</p>
            </div>

            <div className="detail-section">
              <h3>🥄 How to Consume</h3>
              <p>{product.usage}</p>
            </div>



            <div className="detail-section">
              <h3>⚠️ Possible Side Effects</h3>
              <p>{product.sideEffects}</p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Expiry Date: </span>
                <strong>{new Date(product.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
              <span className={`stock-status ${stockStatus}`}>
                {stockStatus === 'in-stock' ? '✅' : stockStatus === 'low-stock' ? '⚠️' : '❌'} {stockText}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--gray-500)', display: 'block', marginBottom: '6px' }}>Quantity</span>
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className={`btn ${added ? 'btn-gold' : 'btn-primary'} btn-lg`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
              </button>
              <button
                className={`btn btn-secondary btn-lg`}
                onClick={handleWishlist}
              >
                {isInWishlist(product.id) ? '❤️ In Wishlist' : '🤍 Wishlist'}
              </button>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="reviews-section">
            <h2>Customer Reviews ({product.reviews.length})</h2>
            {product.reviews.map((review, i) => (
              <div key={i} className="review-card">
                <div className="review-header">
                  <div>
                    <span className="review-user">{review.user}</span>
                    <div className="stars" style={{ fontSize: '14px' }}>{getStars(review.rating)}</div>
                  </div>
                  <span className="review-date">
                    {new Date(review.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
