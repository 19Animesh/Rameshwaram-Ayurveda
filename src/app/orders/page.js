'use client';
/**
 * /orders — order history for the signed-in customer.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The footer links to /orders as "Track Order" on every page of the site, but
 * no route existed, so the link 404'd sitewide. (This was visible in the
 * network trace as `orders?_rsc=... 404` on every page load, because Next.js
 * prefetches footer links.) The order-detail page at /orders/[id]/track was
 * already implemented and is linked from here.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/format';

const STATUS_STYLES = {
  pending: { label: 'Pending', bg: '#fef3c7', fg: '#92400e' },
  confirmed: { label: 'Confirmed', bg: '#dbeafe', fg: '#1e40af' },
  processing: { label: 'Processing', bg: '#ede9fe', fg: '#5b21b6' },
  shipped: { label: 'Shipped', bg: '#e0e7ff', fg: '#3730a3' },
  delivered: { label: 'Delivered', bg: '#d1fae5', fg: '#065f46' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', fg: '#991b1b' },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    // Not signed in: skip the request entirely rather than firing a 401.
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/orders');
        const json = await res.json().catch(() => null);

        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || `Request failed with status ${res.status}`);
        }
        if (!cancelled) setOrders(json.data?.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        if (!cancelled) setError(err.message || 'Could not load your orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="loading-spinner" style={{ marginTop: '100px' }}></div>;
  }

  if (!user) {
    return (
      <div className="empty-state" style={{ marginTop: '100px' }}>
        <span className="empty-icon">🔑</span>
        <h3>Sign in to see your orders</h3>
        <p>Your order history and tracking details live here once you&apos;re signed in.</p>
        <Link href="/auth/login?next=/orders" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ marginTop: '100px' }}>
        <span className="empty-icon">⚠️</span>
        <h3>Couldn&apos;t load your orders</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: '100px' }}>
        <span className="empty-icon">📦</span>
        <h3>No orders yet</h3>
        <p>When you place an order it will appear here.</p>
        <Link href="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link> <span>/</span> <span>My Orders</span>
          </div>
          <h1>My Orders</h1>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 'var(--space-2xl, 48px)' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {orders.map((order) => {
            const status = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            const itemCount = (order.items || []).reduce(
              (sum, i) => sum + (i.quantity || 1),
              0
            );

            return (
              <div
                key={order.id || order._id}
                style={{
                  border: '1px solid var(--gray-200, #e5e7eb)',
                  borderRadius: '12px',
                  padding: '16px',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Order #{String(order.id || order._id).slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500, #6b7280)' }}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : ''}
                      {itemCount > 0 && ` · ${itemCount} item${itemCount > 1 ? 's' : ''}`}
                    </div>
                  </div>

                  <span
                    style={{
                      alignSelf: 'flex-start',
                      background: status.bg,
                      color: status.fg,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <strong>{formatPrice(order.total || 0)}</strong>
                  <Link
                    href={`/orders/${order.id || order._id}/track`}
                    className="btn btn-sm btn-primary"
                  >
                    Track Order
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
