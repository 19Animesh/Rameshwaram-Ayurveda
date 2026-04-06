'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

const PRODUCT_EMOJIS = {
  'immunity': '🛡️',
  'digestive-health': '🫄',
  'skin-care': '✨',
  'brain-health': '🧠',
  'joint-care': '💆',
  'womens-health': '🌸',
  'heart-health': '❤️',
  'respiratory-care': '🫁',
  'weight-management': '⚖️',
  'eye-health': '👁️',
  'kidney-health': '🫘',
  'hair-care': '💇',
  'ayurvedic-medicine': '💊',
  'diabetes-care': '🩸',
  'general-wellness': '🌿',
};

export function getProductEmoji(category) {
  return PRODUCT_EMOJIS[category] || '🌿';
}

import { optimizeImageUrl, getBlurUrl } from '@/lib/cloudinary-client';

export function ProductImage({ product, size = 56, style = {} }) {
  const emoji = getProductEmoji(product?.category);
  const hasValidImage = product?.imageUrl && product.imageUrl.startsWith('http');
  const [imgFailed, setImgFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  if (hasValidImage && !imgFailed) {
    const optimizedUrl = optimizeImageUrl(product.imageUrl, { width: size * 2, height: size * 2 }); // Double size for retina
    const blurUrl = getBlurUrl(product.imageUrl);

    return (
      <div style={{ 
        position: 'relative', 
        width: size, 
        height: size, 
        borderRadius: 8, 
        overflow: 'hidden',
        background: 'var(--green-50)',
        flexShrink: 0,
        ...style 
      }}>
        {/* Blur Placeholder */}
        {blurUrl && !isLoaded && (
          <img
            src={blurUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'contain',
              filter: 'blur(10px)',
              transform: 'scale(1.1)',
            }}
          />
        )}
        
        {/* Main Image */}
        <img
          src={optimizedUrl}
          alt={product.name}
          width={size}
          height={size}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain', objectPosition: 'center',
            padding: 4,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
          }}
        />
      </div>
    );
  }
  return (
    <span style={{
      fontSize: size * 0.6, width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, background: 'var(--green-50)', flexShrink: 0,
      ...style
    }}>
      {emoji}
    </span>
  );
}

export function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export function getDiscount(original, current) {
  return Math.round(((original - current) / original) * 100);
}

export default function ProductCard({ product }) {
  const { cart, addToCart, updateQuantity, isInWishlist, addToWishlist, removeFromWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // ── Variant Management ──
  const hasVariants = product.variants && product.variants.length > 1;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  
  const activeVariant = hasVariants ? product.variants[selectedVariantIndex] : null;
  
  // Create an active product representation based on the selected variant
  const activeProduct = {
    ...product,
    id: hasVariants ? `${product.id}-${activeVariant.label}` : product.id,
    name: hasVariants ? `${product.name} (${activeVariant.label})` : product.name,
    price: activeVariant ? activeVariant.price : product.price,
    originalPrice: activeVariant ? activeVariant.originalPrice : product.originalPrice,
    stock: activeVariant ? activeVariant.stock : product.stock
  };

  const cartItem = cart.find(item => item.id === activeProduct.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(activeProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleUpdateQuantity = (e, newQuantity) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(activeProduct.id, newQuantity);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const discount = getDiscount(activeProduct.originalPrice, activeProduct.price);
  const emoji = getProductEmoji(activeProduct.category);

  const hasValidImage = product.imageUrl && product.imageUrl.startsWith('http');

  return (
    <div className="product-card fade-in">
      <div className="product-card-image">
        {hasValidImage && !imgFailed ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Blur Placeholder */}
            {!isLoaded && (
              <img
                src={getBlurUrl(product.imageUrl)}
                alt=""
                style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  objectFit: 'contain',
                  filter: 'blur(20px)',
                  transform: 'scale(1.1)',
                }}
              />
            )}
            <img
              src={optimizeImageUrl(product.imageUrl, { width: 400, height: 400 })}
              alt={product.name}
              className="product-img"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setImgFailed(true)}
              style={{
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
              }}
            />
          </div>
        ) : (
          <span className="product-emoji">{emoji}</span>
        )}
        {discount > 0 && (
          <span className="product-card-badge sale">{discount}% OFF</span>
        )}
        <button
          className={`product-card-wishlist ${isInWishlist(product.id) ? 'active' : ''}`}
          onClick={handleWishlist}
          title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isInWishlist(product.id) ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="product-card-body">
        <div className="product-card-brand">{product.brandName}</div>
        <div className="product-card-name">
          <Link href={`/products/${product.id}`}>{activeProduct.name}</Link>
        </div>
        <div className="product-card-rating">
          <span className="stars">{getStars(product.rating)}</span>
          <span className="rating-count">({product.reviewCount})</span>
        </div>
        
        {/* Variant Selector */}
        {hasVariants && (
          <select 
            className="variant-select"
            value={selectedVariantIndex}
            onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
          >
            {product.variants.map((variant, index) => (
              <option key={index} value={index}>
                {variant.label} — {formatPrice(variant.price)}
              </option>
            ))}
          </select>
        )}

        <div className="product-card-price" style={{ marginTop: hasVariants ? '12px' : 'auto' }}>
          <span className="price-current">{formatPrice(activeProduct.price)}</span>
          {activeProduct.originalPrice > activeProduct.price && (
            <span className="price-original">{formatPrice(activeProduct.originalPrice)}</span>
          )}
          {discount > 0 && (
            <span className="price-discount">{discount}% off</span>
          )}
        </div>
      </div>

      <div className="product-card-actions">
        {quantityInCart > 0 ? (
          <div className="cart-quantity-controls">
            <button className="cart-quantity-btn" onClick={(e) => handleUpdateQuantity(e, quantityInCart - 1)}>−</button>
            <span className="cart-quantity-val">{quantityInCart} in Cart</span>
            <button className="cart-quantity-btn" onClick={(e) => handleUpdateQuantity(e, quantityInCart + 1)}>+</button>
          </div>
        ) : (
          <button
            className={`btn ${added ? 'btn-gold' : 'btn-primary'}`}
            onClick={handleAddToCart}
            disabled={activeProduct.stock === 0}
            style={{ width: '100%' }}
          >
            {activeProduct.stock === 0 ? 'Out of Stock' : added ? '✓ Added!' : '🛒 Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}
