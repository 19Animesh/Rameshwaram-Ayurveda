'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { getProductEmoji, formatPrice, getDiscount } from '@/components/ProductCard';
import { optimizeImageUrl, getBlurUrl } from '@/lib/cloudinary-client';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } = useCart();

  // Separates "this product does not exist" (404) from "the request failed",
  // so a backend outage no longer renders as "Product Not Found".
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/products/${id}`);
        const result = await res.json().catch(() => null);

        if (res.status === 404) {
          if (!cancelled) setProduct(null);
          return;
        }
        if (!res.ok || result?.success === false) {
          throw new Error(result?.error || `Request failed with status ${res.status}`);
        }
        if (!cancelled) setProduct(result.data?.product || result.data || null);
      } catch (err) {
        console.error('Failed to load product:', err);
        if (!cancelled) setLoadError(err.message || 'Could not load this product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="loading-spinner" style={{ marginTop: '100px' }}></div>;

  if (loadError) return (
    <div className="empty-state" style={{ marginTop: '100px' }}>
      <span className="empty-icon">⚠️</span>
      <h3>Couldn&apos;t load this product</h3>
      <p>{loadError}</p>
      <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
    </div>
  );

  if (!product) return (
    <div className="empty-state" style={{ marginTop: '100px' }}>
      <span className="empty-icon">😕</span>
      <h3>Product Not Found</h3>
      <p>The product you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/products" className="btn btn-primary">Browse Products</Link>
    </div>
  );

  // ── Size variants ──
  // Same cart-line shape as ProductCard: `id` is unique per size inside the
  // cart, while `productId` + `variantId`/`variantLabel` let the server look
  // up the real price and stock of that exact size at checkout. Without this,
  // sized products added from this page were rejected at payment time.
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 1;
  const activeVariant = hasVariants
    ? product.variants[Math.min(selectedVariantIndex, product.variants.length - 1)]
    : null;
  const activeProduct = {
    ...product,
    id: hasVariants ? `${product.id}-${activeVariant.label}` : product.id,
    productId: product.id,
    variantId: activeVariant?._id ? String(activeVariant._id) : null,
    variantLabel: activeVariant ? activeVariant.label : null,
    name: hasVariants ? `${product.name} (${activeVariant.label})` : product.name,
    price: activeVariant ? activeVariant.price : product.price,
    originalPrice: activeVariant ? activeVariant.originalPrice : product.originalPrice,
    stock: activeVariant ? (activeVariant.stock ?? 0) : product.stock,
  };

  const discount = getDiscount(activeProduct.originalPrice, activeProduct.price);
  const emoji = getProductEmoji(product.category);

  const handleAddToCart = () => {
    addToCart(activeProduct, quantity);
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

  const stock = activeProduct.stock;
  const stockStatus = stock > 50 ? 'in-stock' : stock > 0 ? 'low-stock' : 'out-of-stock';
  const stockText = stock > 50 ? 'In Stock' : stock > 0 ? `Only ${stock} left` : 'Out of Stock';

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
              <div className="product-detail-photo">
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

            <div className="product-detail-price">
              <span className="price-current">{formatPrice(activeProduct.price)}</span>
              {activeProduct.originalPrice > activeProduct.price && (
                <>
                  <span className="price-original">{formatPrice(activeProduct.originalPrice)}</span>
                  <span className="price-discount">{discount}% off</span>
                </>
              )}
            </div>

            {hasVariants && (
              <div className="variant-picker" role="radiogroup" aria-label="Size">
                <span className="variant-picker-label">Size</span>
                <div className="variant-picker-options">
                  {product.variants.map((variant, index) => {
                    const soldOut = (variant.stock ?? 0) <= 0;
                    const selected = index === selectedVariantIndex;
                    return (
                      <button
                        key={variant._id || variant.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`variant-chip${selected ? ' selected' : ''}${soldOut ? ' sold-out' : ''}`}
                        onClick={() => { setSelectedVariantIndex(index); setQuantity(1); }}
                      >
                        <span className="variant-chip-label">{variant.label}</span>
                        <span className="variant-chip-price">
                          {soldOut ? 'Out of stock' : formatPrice(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  <button onClick={() => setQuantity(Math.max(1, Math.min(stock, quantity + 1)))}>+</button>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className={`btn ${added ? 'btn-gold' : 'btn-primary'} btn-lg`}
                onClick={handleAddToCart}
                disabled={stock <= 0}
              >
                {stock <= 0 ? 'Out of Stock' : added ? '✓ Added to Cart!' : '🛒 Add to Cart'}
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


      </div>
    </>
  );
}
