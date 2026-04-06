'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, fetchOrders } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';

// ── Avatar initials helper ───────────────────────────────────────────
function Avatar({ name, size = 72 }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--green-600), var(--gold-500))',
      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    }}>
      {initials}
    </div>
  );
}

// ── Order status badge ───────────────────────────────────────────────
const STATUS_COLOR = {
  PENDING: { bg: '#fff7e0', color: '#b45309' },
  PAID:    { bg: '#e0f7f0', color: '#065f46' },
  SHIPPED: { bg: '#e0f0ff', color: '#1e40af' },
  DELIVERED: { bg: '#e6f5e0', color: '#15803d' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c' },
};
function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.PENDING;
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 'var(--radius-full)',
      fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
      background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [addresses, setAddresses] = useState(null); // null = not yet loaded

  // Init form from user
  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  // Load orders when tab opens
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId && activeTab === 'orders') {
      setOrdersLoading(true);
      fetchOrders(userId)
        .then(res => {
          const payload = res.data || res;
          setOrders(payload.orders || []);
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [user, activeTab]);

  // Load addresses from DB when Addresses tab opens
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId && activeTab === 'addresses' && addresses === null) {
      const token = localStorage.getItem('ayurvedic_token');
      fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(res => {
           const payload = res.data || res;
           setAddresses(payload.user?.addresses || []);
        })
        .catch(() => setAddresses([]));
    }
  }, [user, activeTab, addresses]);

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: 60 }}>
          <span className="empty-icon">🔐</span>
          <h3>Please Sign In</h3>
          <p>You need to sign in to view your account.</p>
          <Link href="/auth/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const data = await updateProfile({ name: form.name, phone: form.phone });
      updateUser(data.user);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'orders',  label: 'My Orders', icon: '📦' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a> <span>/</span> <span>My Account</span>
          </div>
          <h1>My Account</h1>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 'var(--space-3xl)' }}>
        <div className="account-layout">

          {/* ── Sidebar ── */}
          <div className="account-sidebar">
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', borderBottom: '1px solid var(--gray-100)', marginBottom: 'var(--space-md)' }}>
              <Avatar name={user.name} size={72} />
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 16, color: 'var(--green-900)' }}>{user.name}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{user.email}</div>
              <span className={`badge ${user.role === 'admin' ? 'badge-gold' : 'badge-green'}`} style={{ marginTop: 8, display: 'inline-block' }}>
                {user.role}
              </span>
            </div>

            {tabs.map(t => (
              <button
                key={t.id}
                className={`account-nav-item ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}

            <button className="account-nav-item" onClick={() => { logout(); router.push('/'); }} style={{ color: 'var(--danger)', marginTop: 'auto' }}>
              🚪 Sign Out
            </button>
          </div>

          {/* ── Content ── */}
          <div className="account-content fade-in">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="card" style={{ padding: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                  <h2 style={{ margin: 0 }}>Profile Information</h2>
                  {!editing && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(true); setSaveSuccess(false); }}>
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>

                {saveSuccess && (
                  <div style={{ background: '#e6f5e0', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontWeight: 500 }}>
                    ✅ Profile updated successfully!
                  </div>
                )}

                {editing ? (
                  <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        className="form-input"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input className="form-input" value={user.email} disabled style={{ background: 'var(--gray-50)', color: 'var(--gray-400)', cursor: 'not-allowed' }} />
                      <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Email cannot be changed</span>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        className="form-input"
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    {saveError && (
                      <div style={{ color: 'var(--danger)', fontSize: 14 }}>⚠️ {saveError}</div>
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : '💾 Save Changes'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setSaveError(''); setForm({ name: user.name || '', phone: user.phone || '' }); }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
                    {[
                      { label: 'Full Name', value: user.name },
                      { label: 'Email', value: user.email },
                      { label: 'Phone', value: user.phone || '—' },
                      { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-md)', borderBottom: '1px solid var(--gray-100)', paddingBottom: 'var(--space-sm)' }}>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)', minWidth: 120 }}>{label}</span>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Orders Tab ── */}
            {activeTab === 'orders' && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 'var(--space-lg)' }}>My Orders</h2>
                {ordersLoading ? (
                  <div className="loading-spinner" />
                ) : orders.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h3>No Orders Yet</h3>
                    <p>When you place orders, they'll appear here.</p>
                    <Link href="/products" className="btn btn-primary">Start Shopping</Link>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="order-card" style={{ marginBottom: 'var(--space-md)' }}>
                      <div className="order-header">
                        <div>
                          <strong style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--green-800)' }}>{order.id}</strong>
                          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                            {order.createdAt ? formatDate(order.createdAt) : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                          <StatusBadge status={order.status} />
                          <strong style={{ fontSize: 16, color: 'var(--green-800)' }}>{formatPrice(order.total)}</strong>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 14 }}>
                            <span style={{ color: 'var(--gray-700)' }}>{item.name} <span style={{ color: 'var(--gray-400)' }}>×{item.quantity}</span></span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Payment: <strong style={{ color: 'var(--gray-600)', textTransform: 'uppercase' }}>{order.paymentMethod}</strong></span>
                        <Link href={`/orders/${order.id}/track`} className="btn btn-sm btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}>
                          🚚 Track Order
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Addresses Tab ── */}
            {activeTab === 'addresses' && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 'var(--space-lg)' }}>Saved Addresses</h2>
                {addresses === null ? (
                  <div className="loading-spinner" />
                ) : addresses.length > 0 ? (
                  addresses.map(addr => (
                    <div key={addr.id} className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)', borderLeft: addr.isDefault ? '4px solid var(--green-500)' : '4px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                        <strong>{addr.fullName}</strong>
                        {addr.isDefault && <span className="badge badge-green">Default</span>}
                      </div>
                      <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.6 }}>
                        {addr.street}<br />
                        {addr.city}, {addr.state} — {addr.pincode}<br />
                        📞 {addr.phone}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📍</span>
                    <h3>No Saved Addresses</h3>
                    <p>Addresses saved during checkout will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
