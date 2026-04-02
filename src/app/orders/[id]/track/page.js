'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

const STEPS = [
  { key: 'confirmed',  label: 'Order Confirmed',  icon: '✅', desc: 'Your order has been received and confirmed.' },
  { key: 'processing', label: 'Processing',        icon: '⚙️',  desc: 'We are preparing your Ayurvedic medicines.' },
  { key: 'shipped',    label: 'Out for Delivery',  icon: '🚚', desc: 'Your package is on the way!' },
  { key: 'delivered',  label: 'Delivered',         icon: '📬', desc: 'Your order has been delivered. Enjoy!' },
];

function getStepIndex(status) {
  const s = (status || '').toLowerCase();
  if (s === 'cancelled') return -1;
  const i = STEPS.findIndex(st => st.key === s);
  return i === -1 ? 0 : i;
}

// Animated truck on a progress road
function TruckTracker({ stepIndex, cancelled }) {
  const pct = cancelled ? 0 : Math.max(0, Math.min(100, (stepIndex / (STEPS.length - 1)) * 100));

  return (
    <div style={{ margin: '32px 0', userSelect: 'none' }}>
      {/* Road */}
      <div style={{ position: 'relative', height: 56, background: '#e8f5e9', borderRadius: 40, overflow: 'hidden', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* Road markings */}
        <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: 3, background: 'repeating-linear-gradient(90deg, #C9A84C 0, #C9A84C 24px, transparent 24px, transparent 48px)', transform: 'translateY(-50%)', opacity: 0.5 }} />
        {/* Progress fill */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'linear-gradient(90deg, #1B4332, #2d6a4f)', borderRadius: 40, transition: 'width 1s ease', opacity: 0.18 }} />
        {/* Truck */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `calc(${pct}% - 28px)`,
          transform: 'translateY(-50%)',
          transition: 'left 1s cubic-bezier(0.4,0,0.2,1)',
          fontSize: 36,
          filter: cancelled ? 'grayscale(1)' : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
          animation: (!cancelled && stepIndex >= 0 && stepIndex < STEPS.length - 1) ? 'truckBounce 0.5s ease infinite alternate' : 'none',
        }}>
          {cancelled ? '❌' : '🚚'}
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 4px' }}>
        {STEPS.map((step, i) => {
          const done = !cancelled && i <= stepIndex;
          const active = !cancelled && i === stepIndex;
          return (
            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#1B4332' : '#e0e0e0',
                color: done ? '#fff' : '#999',
                border: active ? '3px solid #C9A84C' : '3px solid transparent',
                boxShadow: active ? '0 0 0 3px rgba(201,168,76,0.25)' : 'none',
                transition: 'all 0.4s ease',
                fontWeight: 700, fontSize: 14,
              }}>
                {done ? step.icon : (i + 1)}
              </div>
              <div style={{ fontSize: 11, textAlign: 'center', marginTop: 4, color: active ? '#1B4332' : '#999', fontWeight: active ? 700 : 400, maxWidth: 80 }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes truckBounce {
          from { transform: translateY(calc(-50% - 2px)); }
          to   { transform: translateY(calc(-50% + 2px)); }
        }
      `}</style>
    </div>
  );
}

export default function TrackOrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.order) setOrder(d.order);
        else setError('Order not found.');
      })
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner" style={{ marginTop: 100 }} />;

  if (error || !order) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <span className="empty-icon">📦</span>
          <h3>Order Not Found</h3>
          <p>{error || 'This order does not exist.'}</p>
          <Link href="/account" className="btn btn-primary">My Orders</Link>
        </div>
      </div>
    );
  }

  const cancelled = order.status?.toLowerCase() === 'cancelled';
  const stepIndex = getStepIndex(order.status);
  const currentStep = cancelled ? null : STEPS[stepIndex];

  const statusColors = {
    confirmed:  { bg: '#e8f5e9', color: '#1B4332' },
    processing: { bg: '#fff8e1', color: '#b45309' },
    shipped:    { bg: '#e3f2fd', color: '#1565c0' },
    delivered:  { bg: '#e8f5e9', color: '#2e7d32' },
    cancelled:  { bg: '#fce4ec', color: '#c62828' },
  };
  const sc = statusColors[order.status?.toLowerCase()] || statusColors.confirmed;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> <span>/</span>
            <Link href="/account">My Account</Link> <span>/</span>
            <span>Track Order</span>
          </div>
          <h1>Track Your Order</h1>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60, maxWidth: 740 }}>

        {/* Order ID + Status */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 20, borderLeft: `5px solid ${sc.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ORDER ID</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 17, color: '#1B4332' }}>{order.id}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1B4332' }}>₹{order.total?.toLocaleString('en-IN')}</div>
              <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', background: sc.bg, color: sc.color, marginTop: 4 }}>
                {cancelled ? '❌ Cancelled' : currentStep?.icon + ' ' + currentStep?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Animated Tracker */}
        <div className="card" style={{ padding: '28px 28px 20px' }}>
          <h3 style={{ marginBottom: 0, color: '#1B4332', fontSize: 16 }}>🗺️ Live Delivery Status</h3>
          {cancelled ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#c62828' }}>
              <div style={{ fontSize: 48 }}>❌</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>Order Cancelled</div>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>This order has been cancelled.</div>
            </div>
          ) : (
            <>
              <TruckTracker stepIndex={stepIndex} cancelled={cancelled} />
              {currentStep && (
                <div style={{ textAlign: 'center', padding: '12px 0 4px', background: '#f8f5f0', borderRadius: 10, marginTop: 4 }}>
                  <div style={{ fontSize: 13, color: '#555' }}>{currentStep.desc}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status History Timeline */}
        {order.statusHistory?.length > 0 && (
          <div className="card" style={{ padding: '24px 28px', marginTop: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>📋 Status History</h3>
            {[...order.statusHistory].reverse().map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 16, borderBottom: i < order.statusHistory.length - 1 ? '1px solid #f0f0f0' : 'none', marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1B4332', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize', color: '#1B4332' }}>{h.status}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{h.note}</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{new Date(h.date).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Items summary */}
        <div className="card" style={{ padding: '24px 28px', marginTop: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: 16 }}>🛒 Items Ordered</h3>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f5f5f5' : 'none', fontSize: 14 }}>
              <span style={{ color: '#444' }}>{item.name} <span style={{ color: '#aaa' }}>× {item.quantity}</span></span>
              <span style={{ fontWeight: 600, color: '#1B4332' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid #e8f5e9', fontWeight: 800, fontSize: 16, color: '#1B4332' }}>
            <span>Total</span>
            <span>₹{order.total?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Delivery address */}
        {order.address && (
          <div className="card" style={{ padding: '24px 28px', marginTop: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>📍 Delivery Address</h3>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#555' }}>
              <strong>{order.address.fullName}</strong><br />
              {order.address.street}<br />
              {order.address.city}, {order.address.state} – {order.address.pincode}<br />
              📞 {order.address.phone}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link href="/account" className="btn btn-secondary">← Back to My Orders</Link>
        </div>
      </div>
    </>
  );
}
