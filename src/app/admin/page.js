'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/components/ProductCard';
import OrdersTable from '@/components/admin/OrdersTable';
import ProductsTable from '@/components/admin/ProductsTable';

const EMPTY_PRODUCT = {
  name: '', brandId: '27', brandName: '', description: '', price: '', originalPrice: '',
  category: 'general-wellness', stock: '', dosage: '', usage: '',
  sideEffects: '', expiryDate: '', imageUrl: '', featured: false,
};

// Helper: get auth headers with Bearer token
function authHeaders(extra = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ayurvedic_token') : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [inlineStock, setInlineStock] = useState({});
  const [savingStock, setSavingStock] = useState(null);
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const PRODUCTS_PER_PAGE = 50;
  const fileInputRef = useRef(null);
  // ── Order detail popup ──
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
  const closeOrderModal = () => {
    setShowOrderModal(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadProducts(productPage, searchTerm); }, [productPage]);


  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: authHeaders() }),
        fetch('/api/orders', { headers: authHeaders() }),
      ]);
      const [statsFull, ordersFull] = await Promise.all([
        statsRes.json(), ordersRes.json(),
      ]);
      const statsData = statsFull.data || {};
      const ordersData = ordersFull.data || {};
      setStats(statsData);
      setOrders(ordersData.orders || []);
    } catch (err) { console.error(err); }
    // Load first page of products
    await loadProducts(1, '');
    setLoading(false);
  };

  const loadProducts = async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PRODUCTS_PER_PAGE),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      const data = json.data || {};
      const prods = data.products || [];
      setProducts(prods);
      setProductTotal(data.total || 0);
      const stockMap = {};
      prods.forEach(p => { stockMap[p.id] = p.stock; });
      setInlineStock(stockMap);
    } catch (err) { console.error('loadProducts error:', err); }
  };

  // Debounced search handler
  const handleSearch = (val) => {
    setSearchTerm(val);
    setProductPage(1);
    loadProducts(1, val);
  };


  // ── Image file → base64 → preview ──
  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as WebP for tiny base64
        const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
        setForm(f => ({ ...f, imageUrl: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── Save product (add or edit) ──
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Build payload - separate 'image' (for upload) from 'imageUrl' (already a Cloudinary URL)
    const isBase64 = form.imageUrl?.startsWith('data:image/');
    const payload = {
      name: form.name,
      brandId: form.brandId || '27',
      brandName: form.brandName,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || Number(form.price),
      stock: Number(form.stock),
      dosage: form.dosage,
      usage: form.usage,
      sideEffects: form.sideEffects,
      expiryDate: form.expiryDate,
      featured: form.featured,
      // Only send 'image' (triggers Cloudinary upload) if it's base64.
      // Otherwise send 'imageUrl' directly (already a hosted URL).
      ...(isBase64
        ? { image: form.imageUrl }
        : { imageUrl: form.imageUrl }
      ),
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        showToast('✅ Product updated!');
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        showToast('✅ Product added!');
      }
      setShowModal(false);
      setEditingProduct(null);
      setForm(EMPTY_PRODUCT);
      loadProducts(productPage, searchTerm);

    } catch (err) { 
      console.error(err);
      alert('Edit Error: ' + err.message);
      showToast('❌ Failed to save product');
    }
  };

  // ── Delete product ──
  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('🗑️ Product deleted');
      loadProducts(productPage, searchTerm);

    } catch { showToast('❌ Failed to delete'); }
  };

  // ── Open edit modal ──
  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      brandId: product.brandId || '27',        // ✅ was: brand: product.brand (field doesn't exist)
      brandName: product.brandName || '',       // ✅ added: missing from previous version
      description: product.description || '',
      price: String(product.price || ''),
      originalPrice: String(product.originalPrice || product.price || ''),
      category: product.category || 'general-wellness',
      stock: String(product.stock || ''),
      dosage: product.dosage || '',
      usage: product.usage || '',
      sideEffects: product.sideEffects || '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      imageUrl: product.imageUrl || '',
      featured: product.featured || false,
    });
    setShowModal(true);
  };

  // ── Inline stock quick-save ──
  const saveInlineStock = async (productId) => {
    setSavingStock(productId);
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ stock: Number(inlineStock[productId]) }),
      });
      showToast('✅ Stock updated');
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Number(inlineStock[productId]) } : p));
    } catch { showToast('❌ Failed to update stock'); }
    setSavingStock(null);
  };

  // ── Update order status ──
  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      showToast('✅ Order status updated');
      loadData();
    } catch { showToast('❌ Failed to update order'); }
  };

  // Products are already filtered server-side via search
  const filteredProducts = products;
  const totalPages = Math.ceil(productTotal / PRODUCTS_PER_PAGE);


  // ── Access guard ──
  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <span className="empty-icon">🔒</span>
          <h3>Admin Access Required</h3>
          <p>Please sign in with an admin account to access this panel.</p>
          <Link href="/auth/login" className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout" suppressHydrationWarning>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#1B4332', color: '#fff', padding: '12px 20px',
          borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          fontSize: 14, fontWeight: 500, animation: 'fadeIn 0.3s ease',
        }}>{toast}</div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: 'var(--space-md) var(--space-lg)', marginBottom: 'var(--space-md)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>🌿 Admin Panel</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{user.email}</div>
        </div>
        <button className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
        <button className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>💊 Products ({productTotal})</button>
        <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📦 Orders ({orders.length})</button>
        <Link href="/" className="admin-nav-item" style={{ marginTop: 'auto' }}>🏠 Back to Store</Link>
      </aside>

      <main className="admin-content">
        {loading ? <div className="loading-spinner"></div> : (
          <>
            {/* ── Dashboard ── */}
            {activeTab === 'dashboard' && stats && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 'var(--space-lg)' }}>📊 Dashboard Overview</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--green-100)' }}>💰</div>
                    <div className="stat-value">{formatPrice(stats.stats?.totalRevenue || 0)}</div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--gold-100)' }}>📦</div>
                    <div className="stat-value">{stats.stats?.totalOrders || 0}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e6f0fd' }}>💊</div>
                    <div className="stat-value">{stats.stats?.totalProducts || 0}</div>
                    <div className="stat-label">Products</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fde8e6' }}>👥</div>
                    <div className="stat-value">{stats.stats?.totalCustomers || 0}</div>
                    <div className="stat-label">Customers</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
                  <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>⚠️ Low Stock Alert</h3>
                    {stats.lowStockProducts?.length === 0
                      ? <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>All products well stocked! 🎉</p>
                      : stats.lowStockProducts?.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
                          <span>{p.name}</span>
                          <span className="badge badge-red">{p.stock} left</span>
                        </div>
                      ))}
                  </div>
                  <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>📂 Categories</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {stats.categoryDistribution && Object.entries(stats.categoryDistribution).map(([cat, count]) => (
                        <span key={cat} className="badge badge-green" style={{ padding: '6px 14px' }}>
                          {cat.replace('-', ' ')}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Products ── */}
            {activeTab === 'products' && (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 12 }}>
                  <h2>💊 Products ({productTotal} total)</h2>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      className="form-input"
                      placeholder="🔍 Search products..."
                      value={searchTerm}
                      onChange={e => handleSearch(e.target.value)}
                      style={{ width: 220, margin: 0 }}
                    />
                    <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setForm(EMPTY_PRODUCT); setShowModal(true); }}>
                      + Add Product
                    </button>
                  </div>
                </div>

                <ProductsTable 
                  products={filteredProducts}
                  inlineStock={inlineStock}
                  setInlineStock={setInlineStock}
                  savingStock={savingStock}
                  saveInlineStock={saveInlineStock}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, padding: '12px 0' }}>
                    <button
                      onClick={() => setProductPage(p => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                      style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #ddd', background: productPage === 1 ? '#f0f0f0' : '#1B4332', color: productPage === 1 ? '#999' : '#fff', cursor: productPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>Page {productPage} of {totalPages}</span>
                    <button
                      onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                      disabled={productPage === totalPages}
                      style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #ddd', background: productPage === totalPages ? '#f0f0f0' : '#1B4332', color: productPage === totalPages ? '#999' : '#fff', cursor: productPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Orders ── */}
            {activeTab === 'orders' && (
              <div className="fade-in">
                <h2 style={{ marginBottom: 'var(--space-lg)' }}>📦 All Orders ({orders.length})</h2>
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h3>No Orders Yet</h3>
                    <p>Orders will appear here when customers place them.</p>
                  </div>
                ) : (
                  <OrdersTable 
                    orders={orders}
                    openOrderDetail={openOrderDetail}
                    handleOrderStatus={handleOrderStatus}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Add / Edit Product Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>
              {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
            </h2>
            <form onSubmit={handleSave}>

              {/* Image section */}
              <div className="form-group">
                <label>Product Image</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Preview */}
                  <div style={{
                    width: 100, height: 100, borderRadius: 10, border: '2px dashed #C9A84C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', background: '#f8f5f0', flexShrink: 0
                  }}>
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 32 }}>📷</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '8px 16px', background: '#1B4332', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                      📁 Upload Image
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
                    <br />
                    <input
                      className="form-input"
                      placeholder="or paste image URL: https://..."
                      value={form.imageUrl?.startsWith('data:') ? '' : form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      style={{ marginTop: 4 }}
                    />
                    {form.imageUrl && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 12, marginTop: 4 }}>
                        ✕ Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Brand Name *</label>
                  <input className="form-input" value={form.brandName} onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Original / MRP (₹)</label>
                  <input className="form-input" type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Category *</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="immunity">Immunity</option>
                    <option value="digestive-health">Digestive Health</option>
                    <option value="skin-care">Skin Care</option>
                    <option value="brain-health">Brain Health</option>
                    <option value="joint-care">Joint Care</option>
                    <option value="womens-health">Women's Health</option>
                    <option value="heart-health">Heart Health</option>
                    <option value="respiratory-care">Respiratory</option>
                    <option value="hair-care">Hair Care</option>
                    <option value="eye-health">Eye Health</option>
                    <option value="weight-management">Weight Management</option>
                    <option value="kidney-health">Kidney Health</option>
                    <option value="diabetes-care">Diabetes Care</option>
                    <option value="ayurvedic-medicine">Ayurvedic Medicine</option>
                    <option value="general-wellness">General Wellness</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input className="form-input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label>Dosage</label>
                <input className="form-input" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 1-2 tablets twice daily" />
              </div>
              <div className="form-group">
                <label>Usage / How to Consume</label>
                <textarea className="form-input" rows={2} value={form.usage} onChange={e => setForm(f => ({ ...f, usage: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Side Effects</label>
                <textarea className="form-input" rows={2} value={form.sideEffects} onChange={e => setForm(f => ({ ...f, sideEffects: e.target.value }))} placeholder="None reported when taken as directed." />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label className="filter-option">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                    Show as Featured Product
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingProduct(null); setForm(EMPTY_PRODUCT); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? '💾 Save Changes' : '➕ Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {showOrderModal && selectedOrder && (
        <div
          className="modal-overlay"
          onClick={closeOrderModal}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 560,
              width: '95vw',
              maxHeight: '88vh',
              overflowY: 'auto',
              borderRadius: 18,
              padding: 0,
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
              padding: '24px 28px',
              borderRadius: '18px 18px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}>ORDER DETAILS</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-heading)' }}>
                  #{selectedOrder.id?.slice(-10) || selectedOrder._id}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`order-status ${selectedOrder.status}`} style={{ fontSize: 12 }}>
                  {selectedOrder.status}
                </span>
                <button
                  onClick={closeOrderModal}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                    fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px' }}>

              {/* Customer Info */}
              <div style={{
                background: '#f0f7f4',
                borderRadius: 12,
                padding: '18px 20px',
                marginBottom: 20,
                border: '1px solid #d1ead8',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
                  👤 Customer Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Full Name</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {selectedOrder.address?.fullName || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Phone Number</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      📞 {selectedOrder.address?.phone || selectedOrder.address?.phoneNumber || '—'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Delivery Address</div>
                    <div style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.6 }}>
                      📍 {
                        [
                          selectedOrder.address?.street || selectedOrder.address?.address,
                          selectedOrder.address?.city,
                          selectedOrder.address?.state,
                          selectedOrder.address?.pincode || selectedOrder.address?.zip,
                        ].filter(Boolean).join(', ') || '—'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Ordered */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                  💊 Medicines / Items Ordered
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: idx % 2 === 0 ? '#fafafa' : '#fff',
                      border: '1px solid #eee',
                      borderRadius: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          Qty: <strong>{item.quantity}</strong> &nbsp;×&nbsp; {formatPrice(item.price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#1B4332', fontSize: 14 }}>
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div style={{
                borderTop: '2px dashed #e0e0e0',
                paddingTop: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#888' }}>Payment Method</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    <span className="badge badge-green" style={{ textTransform: 'uppercase' }}>
                      {selectedOrder.paymentMethod || '—'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#888' }}>Order Total</div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: '#1B4332' }}>
                    {formatPrice(selectedOrder.total || selectedOrder.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-secondary" onClick={closeOrderModal}>Close</button>
                <select
                  className="sort-select"
                  value={selectedOrder.status}
                  onChange={e => {
                    handleOrderStatus(selectedOrder.id, e.target.value);
                    setSelectedOrder(prev => ({ ...prev, status: e.target.value }));
                  }}
                  style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8 }}
                >
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="processing">⚙️ Processing</option>
                  <option value="shipped">🚚 Shipped</option>
                  <option value="delivered">📬 Delivered</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
