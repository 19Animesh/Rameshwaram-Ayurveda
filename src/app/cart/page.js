'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ProductImage, formatPrice } from '@/components/ProductCard';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <span className="empty-icon">🛒</span>
          <h3>Your Cart is Empty</h3>
          <p>Looks like you haven't added any Ayurvedic medicines yet.</p>
          <Link href="/products" className="btn btn-primary btn-lg">
            🛍️ Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const deliveryCharge = cartTotal >= 500 ? 0 : 49;
  const totalAmount = cartTotal + deliveryCharge;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a> <span>/</span> <span>Shopping Cart</span>
          </div>
          <h1>🛒 Shopping Cart ({cartCount} items)</h1>
        </div>
      </div>

      <div className="container">
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item fade-in">
                <div className="cart-item-image">
                  <ProductImage product={item} size={72} />
                </div>
                <div className="cart-item-info">
                  <Link href={`/products/${item.id}`} className="cart-item-name">{item.name}</Link>
                  <div className="cart-item-brand">{item.brand}</div>
                  <div className="cart-item-price">{formatPrice(item.price)} × {item.quantity}</div>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-selector">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--green-800)', fontSize: 16 }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>
                    ✕ Remove
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
              <button onClick={clearCart} className="btn btn-sm" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                🗑️ Clear Cart
              </button>
            </div>
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({cartCount} items)</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span style={{ color: deliveryCharge === 0 ? 'var(--success)' : 'inherit' }}>
                {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
              </span>
            </div>
            {deliveryCharge > 0 && (
              <div style={{ fontSize: 12, color: 'var(--success)', padding: '4px 0' }}>
                Add {formatPrice(500 - cartTotal)} more for FREE delivery!
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
              Proceed to Checkout →
            </Link>
            <Link href="/products" className="btn btn-secondary" style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
