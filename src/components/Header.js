'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { cartCount, clearCart } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevCartCount = useRef(cartCount);
  const searchRef = useRef(null);
  const router = useRouter();

  // Trigger bounce animation whenever an item is added to cart
  useEffect(() => {
    setMounted(true);
    if (cartCount > prevCartCount.current) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 600);
      prevCartCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        const result = await res.json();
        const productData = result.data || {};
        setSuggestions(productData.products?.slice(0, 5) || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <Image src="/logo.png" alt="Rameshwaram Ayurveda" width={80} height={80} style={{ objectFit: 'contain' }} />
        </Link>

        <form className="header-search" ref={searchRef} onSubmit={handleSearch}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search medicines, brands, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map(product => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="search-suggestion-item"
                  onClick={() => { setShowSuggestions(false); setSearchQuery(''); }}
                >
                  <div>
                    <div className="suggestion-name">{product.name}</div>
                    <div className="suggestion-brand">{product.brandName} &middot; ₹{product.price}</div>
                  </div>
                </Link>
              ))}
              <Link
                href={`/products?search=${encodeURIComponent(searchQuery)}`}
                className="search-suggestion-item"
                style={{ color: 'var(--green-600)', fontWeight: 600, fontSize: 13 }}
                onClick={() => setShowSuggestions(false)}
              >
                View all results for "{searchQuery}" →
              </Link>
            </div>
          )}
        </form>

        <nav className="nav-actions">
          <Link href="/products" className="nav-link">
            🛍️ <span>Shop</span>
          </Link>
          <Link href="/cart" className="nav-link nav-cart-link">
            <span className={cartBounce ? 'cart-bounce' : ''} style={{ display: 'inline-block' }}>🛒</span>
            <span>Cart</span>
            {mounted && cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
          </Link>
          {mounted ? (
            user ? (
              <>
                <Link href="/account" className="nav-link">
                  👤 <span>{user.name?.split(' ')[0]}</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="nav-link">
                    ⚙️ <span>Admin</span>
                  </Link>
                )}
                <button onClick={() => { logout(); clearCart(); }} className="nav-link" style={{ background: 'none' }}>
                  🚪 <span>Logout</span>
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            )
          ) : (
            <div style={{ width: 68, height: 36 }} />
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            title="Toggle Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </nav>
      </div>

      {/* Mobile Slide-Over Drawer Overlay */}
      <div
        className={`drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className="drawer-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <div className="drawer-title">🌿 Rameshwaram Ayurveda</div>
            <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>

          <nav className="drawer-nav">
            <Link
              href="/products"
              className="drawer-nav-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              🛍️ Shop All Medicines
            </Link>
            <Link
              href="/cart"
              className="drawer-nav-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              🛒 Shopping Cart
              {mounted && cartCount > 0 && (
                <span className="nav-badge" style={{ position: 'static', transform: 'none', marginLeft: 8 }}>
                  {cartCount}
                </span>
              )}
            </Link>
            {mounted && user ? (
              <>
                <Link
                  href="/account"
                  className="drawer-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👤 My Profile ({user.name})
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="drawer-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ⚙️ Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { logout(); clearCart(); setMobileMenuOpen(false); }}
                  className="drawer-nav-item"
                  style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="drawer-nav-item"
                style={{ background: 'var(--green-700)', color: 'white' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                🔑 Sign In
              </Link>
            )}
          </nav>

          {mounted && user && (
            <div className="drawer-footer">
              <div className="drawer-user-info">
                Logged in as <strong>{user.name}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
