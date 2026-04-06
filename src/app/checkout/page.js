'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, ProductImage } from '@/components/ProductCard';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [finalOrderState, setFinalOrderState] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Client-side guard against manual URL manipulation bypassing the middleware
  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [user, router]);

  // Auto-fill name & phone from logged-in user profile
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, ''); // only numbers
    setAddress(prev => ({ ...prev, pincode: pin, city: '', state: '' }));

    if (pin.length === 6) {
      try {
        const res = await fetch(`/api/validate-pincode?pincode=${pin}`);
        const data = await res.json();
        if (res.ok) {
          setAddress(prev => ({
            ...prev,
            pincode: pin,
            city: data.city,
            state: data.state,
          }));
        } else if (res.status === 503) {
          // Service temporarily unavailable — let user fill manually, don't alert
          console.warn('Pincode service unavailable, manual entry required');
        } else if (res.status === 404) {
          // Pincode valid but not found — city/state stays empty for manual entry
        } else {
          console.warn('Pincode error:', data.error);
        }
      } catch (err) {
        console.error('Pincode validation failed', err);
      }
    }
  };

  const deliveryCharge = cartTotal >= 500 ? 0 : 49;
  const totalAmount = cartTotal + deliveryCharge;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      alert('Please fill all address fields');
      return;
    }

    if (paymentMethod === 'cod') {
      await finalizeOrder('none', 'none');
    } else {
      // Trigger Razorpay
      setLoading(true);
      try {
        const orderRes = await fetch('/api/orders/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount })
        });
        
        const orderData = await orderRes.json();
        
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Rameshwaram Ayurveda",
          description: "Purchase from Rameshwaram Ayurveda",
          order_id: orderData.id,
          handler: async function (response) {
            await finalizeOrder(response.razorpay_payment_id, response.razorpay_signature);
          },
          prefill: {
            name: address.fullName,
            contact: address.phone,
          },
          theme: { color: "#3a7f44" }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function(response) {
            alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();
      } catch (err) {
        console.error(err);
        alert('Failed to initialize payment gateway');
      }
      setLoading(false);
    }
  };

  const finalizeOrder = async (paymentId, signature) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ayurvedic_token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id || user._id, // Support fallback
          items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            brand: item.brand,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
          })),
          address,
          paymentMethod,
          paymentId,
          signature,
          subtotal: cartTotal,
          deliveryCharge,
          total: totalAmount,
        }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Failed to place order.');
      }
      
      const payload = json.data || json;
      setOrderId(payload.order?.id || 'ORD-XXXX');
      setFinalOrderState({ items: [...cart], total: totalAmount });
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      alert(err.message || 'Failed to place order. Please try again.');
    }
    setLoading(false);
  };

  if (orderPlaced && finalOrderState) {
    return (
      <div className="container">
        <div className="order-success fade-in">
          <span className="success-icon">🎉</span>
          <h1>Order Placed Successfully!</h1>
          <p>Your order <strong>{orderId}</strong> has been confirmed. We'll start preparing it right away.</p>
          <div className="card" style={{ maxWidth: 450, margin: '0 auto', padding: 'var(--space-lg)', textAlign: 'left' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              {finalOrderState.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 500 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px dashed var(--gray-200)', margin: 'var(--space-sm) 0', paddingTop: 'var(--space-sm)' }} />
            <div className="summary-row"><span>Payment Method</span><span style={{ textTransform: 'uppercase', fontSize: 13, fontWeight: 600 }}>{paymentMethod}</span></div>
            <div className="summary-row total"><span>Total Paid</span><span>{formatPrice(finalOrderState.total)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
            <Link href="/account" className="btn btn-primary">View My Orders</Link>
            <Link href="/products" className="btn btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <span className="empty-icon">🛒</span>
          <h3>Your Cart is Empty</h3>
          <p>Add some products before checkout.</p>
          <Link href="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a> <span>/</span> <a href="/cart">Cart</a> <span>/</span> <span>Checkout</span>
          </div>
          <h1>Checkout</h1>
        </div>
      </div>

      <div className="container">
        <form onSubmit={handlePlaceOrder}>
          <div className="checkout-layout">
            <div>
              {/* Delivery Address */}
              <div className="checkout-section">
                <h2>📍 Delivery Address</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input className="form-input" type="text" value={address.fullName}
                      onChange={e => setAddress({...address, fullName: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input className="form-input" type="tel" value={address.phone}
                      onChange={e => setAddress({...address, phone: e.target.value})} required />
                  </div>
                </div>
                
                <div className="form-group" style={{ maxWidth: '200px' }}>
                  <label>Pincode * <span style={{fontSize:'12px', color:'var(--gray-400)'}}>(Auto-fills City & State)</span></label>
                  <input className="form-input" type="text" maxLength="6" value={address.pincode}
                    onChange={handlePincodeChange} placeholder="e.g. 400001" required />
                </div>

                <div className="form-group">
                  <label>House/Flat No. & Street Address *</label>
                  <input className="form-input" type="text" placeholder="House/Flat no., Building, Street"
                    value={address.street} onChange={e => setAddress({...address, street: e.target.value})} required />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>City *</label>
                    <input className="form-input" type="text" value={address.city}
                      onChange={e => setAddress({...address, city: e.target.value})} required readOnly style={{ backgroundColor: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}/>
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <input className="form-input" type="text" value={address.state}
                      onChange={e => setAddress({...address, state: e.target.value})} required readOnly style={{ backgroundColor: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}/>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-section">
                <h2>💳 Payment Method</h2>
                <div className="payment-options">
                  {[
                    { id: 'upi', name: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm', icon: '📱' },
                    { id: 'card', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', icon: '💳' },
                    { id: 'netbanking', name: 'Net Banking', desc: 'All major banks supported', icon: '🏛️' },
                    { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when you receive', icon: '💵' },
                  ].map(method => (
                    <label key={method.id} className={`payment-option ${paymentMethod === method.id ? 'selected' : ''}`}>
                      <input type="radio" name="payment" value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)} />
                      <div className="payment-option-info">
                        <div className="payment-option-name">{method.name}</div>
                        <div className="payment-option-desc">{method.desc}</div>
                      </div>
                      <span className="payment-option-icon">{method.icon}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="cart-summary">
              <h3>Order Summary</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ProductImage product={item} size={40} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ color: 'var(--gray-400)', fontSize: 12 }}>Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="summary-row" style={{ marginTop: 'var(--space-md)' }}>
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span style={{ color: deliveryCharge === 0 ? 'var(--success)' : 'inherit' }}>
                  {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 'var(--space-md)' }}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : `Place Order — ${formatPrice(totalAmount)}`}
              </button>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 'var(--space-sm)' }}>
                🔒 Your payment is secure and encrypted
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
