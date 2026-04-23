'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, ProductImage } from '@/components/ProductCard';

const CheckCircleIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

const ShoppingBagIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);

const ShoppingCartIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
);

const MapPinIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const CreditCardIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
);

const SmartphoneIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>
);

const BuildingIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
);

const LockIcon = ({ size = 24, className = '', color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const DELIVERY_CHARGE = 100; // ₹100 flat delivery charge

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

  const deliveryCharge = cartTotal > 500 ? 0 : DELIVERY_CHARGE;
  const totalAmount = cartTotal + deliveryCharge;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
      alert('Please fill all address fields');
      return;
    }
    // Online payment via Razorpay
    await initializeRazorpayPayment();
  };

  // ── STEP 1: Ask backend to create a Razorpay order ───────────────────────
  // Frontend sends ONLY productIds + quantities. Amount is calculated server-side.
  const initializeRazorpayPayment = async () => {
    setLoading(true);
    try {
      // Send only identifiers — never prices
      const createRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity:  item.quantity,
          })),
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || 'Could not create payment order');
      }

      // ── STEP 2: Open Razorpay checkout with server-returned data ──────────
      const options = {
        key:         createData.keyId,
        amount:      createData.amountPaise,
        currency:    createData.currency,
        name:        'Rameshwaram Ayurveda',
        description: 'Purchase from Rameshwaram Ayurveda',
        order_id:    createData.razorpayOrderId,
        prefill: {
          name:    address.fullName,
          contact: address.phone,
        },
        theme: { color: '#1B4332' },
        modal: {
          ondismiss: () => setLoading(false),
        },

        handler: async function (response) {
          await verifyAndCreateOrder({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          });
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      alert(err.message || 'Failed to initialize payment gateway');
      setLoading(false);
    }
  };

  // ── STEP 3: Verify signature + create order (backend does all the checks) ──
  const verifyAndCreateOrder = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          items: cart.map(item => ({
            productId: item.id,
            name:      item.name,
            quantity:  item.quantity,
          })),
          address,
          paymentMethod,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      // ✅ Order confirmed — capture snapshot before clearing cart
      const serverTotal = verifyData.order?.totalAmount || totalAmount;
      setOrderId(verifyData.order?.id || razorpay_payment_id);
      setFinalOrderState({
        items:    [...cart],
        subtotal: cartTotal,
        total:    serverTotal,
      });
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      console.error('Verification error:', err);
      alert(err.message || 'Payment succeeded but order creation failed. Contact support with your payment ID.');
    }
    setLoading(false);
  };

  // ── Order Success Screen ───────────────────────────────────────────────────
  if (orderPlaced && finalOrderState) {
    return (
      <div className="container">
        <div className="order-success fade-in" style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircleIcon size={72} color="var(--green-600)" />
          </div>
          <h1 style={{ color: 'var(--green-700)', marginBottom: 8 }}>Order Placed Successfully!</h1>
          <p style={{ color: 'var(--gray-500)', marginBottom: 32 }}>
            Order ID: <strong style={{ color: 'var(--green-800)', fontFamily: 'monospace' }}>{orderId}</strong>
            <br />We&apos;ll start preparing your order right away.
          </p>

          <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--space-lg)', textAlign: 'left', boxShadow: '0 4px 24px rgba(27,67,50,0.12)', border: '1px solid #d1ead8' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBagIcon size={16} color="currentColor" /> Items Ordered</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {finalOrderState.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f6fbf8', borderRadius: 10, border: '1px solid #e2f0e8' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>
                      Qty: {item.quantity} Ã— {formatPrice(item.price)}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#1B4332', fontSize: 15 }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed #d1ead8', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--gray-500)' }}>Subtotal</span>
                <span>{formatPrice(finalOrderState.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--gray-500)' }}>Delivery Charge</span>
                <span>{formatPrice(finalOrderState.total - finalOrderState.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#1B4332', marginTop: 4, paddingTop: 8, borderTop: '1px solid #e2f0e8' }}>
                <span>Total Paid</span>
                <span>{formatPrice(finalOrderState.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                <span>Payment Method</span>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--gray-700)', letterSpacing: 0.5 }}>{paymentMethod}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
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
          <span className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <ShoppingCartIcon size={48} color="var(--gray-400)" />
          </span>
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
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPinIcon size={24} color="currentColor" /> Delivery Address</h2>
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
                  <label>Pincode * <span style={{fontSize:'12px', color:'var(--gray-400)'}}>(Auto-fills City &amp; State)</span></label>
                  <input className="form-input" type="text" maxLength="6" value={address.pincode}
                    onChange={handlePincodeChange} placeholder="e.g. 400001" required />
                </div>

                <div className="form-group">
                  <label>House/Flat No. &amp; Street Address *</label>
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
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><CreditCardIcon size={24} color="currentColor" /> Payment Method</h2>
                <div className="payment-options">
                  {[
                    { id: 'upi',        name: 'UPI Payment',        desc: 'Google Pay, PhonePe, Paytm', icon: <SmartphoneIcon size={24} color="currentColor" /> },
                    { id: 'card',       name: 'Credit/Debit Card',  desc: 'Visa, Mastercard, RuPay',    icon: <CreditCardIcon size={24} color="currentColor" /> },
                    { id: "netbanking", name: "Net Banking",         desc: "All major banks supported",   icon: <BuildingIcon size={24} color="currentColor" /> },
                  ].map(method => (
                    <label key={method.id} className={`payment-option ${paymentMethod === method.id ? 'selected' : ''}`}>
                      <input type="radio" name="payment" value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)} />
                      <div className="payment-option-info">
                        <div className="payment-option-name">{method.name}</div>
                        <div className="payment-option-desc">{method.desc}</div>
                      </div>
                      <span className="payment-option-icon" style={{ display: "flex", alignItems: "center" }}>{method.icon}</span>
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
                <span>Delivery Charge</span>
                <span>{formatPrice(deliveryCharge)}</span>
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
              <p style={{ fontSize: 12, color: 'var(--gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 'var(--space-sm)' }}>
                <LockIcon size={14} /> Your payment is secure and encrypted
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

