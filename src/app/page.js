'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

// Default fallback for emojis if no dynamic matching works
const categoryEmojis = {
  'immunity': '🛡️',
  'digestive-health': '🫄',
  'skin-care': '✨',
  'brain-health': '🧠',
  'joint-care': '💆',
  'womens-health': '🌸',
  'heart-health': '❤️',
  'respiratory-care': '🫁',
  'hair-care': '💇',
  'eye-health': '👁️',
  'general-wellness': '🌱'
};

const SYMPTOMS = [
  { name: 'Low Immunity', emoji: '🤒', search: 'immunity' },
  { name: 'Digestive Issues', emoji: '🤢', search: 'digestion' },
  { name: 'Joint Pain', emoji: '🦴', search: 'pain' },
  { name: 'Stress & Anxiety', emoji: '😰', search: 'stress ashwagandha' },
  { name: 'Hair Fall', emoji: '💇', search: 'hair' },
  { name: 'Skin Problems', emoji: '🧴', search: 'skin neem' },
  { name: 'Cough & Cold', emoji: '🤧', search: 'cough respiratory' },
  { name: 'Memory & Focus', emoji: '🎯', search: 'brain brahmi' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    // Fetch Featured Products
    fetch('/api/products?featured=true')
      .then(res => res.json())
      .then(result => { 
        setFeatured(result.data?.products || []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));

    // Fetch Dynamic Categories
    fetch('/api/products/filters')
      .then(res => res.json())
      .then(result => {
        if (result.data) setDbCategories(result.data.categories || []);
      })
      .catch();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div>
            <h1>
              Ancient Wisdom,<br />
              <span className="highlight">Modern Wellness</span>
            </h1>
            <p>
              Discover authentic Ayurvedic medicines from India's most trusted brands. 
              Boost immunity, improve digestion, and achieve holistic health naturally.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="btn btn-gold btn-lg">
                🛍️ Shop All Medicines
              </Link>
              <Link href="/products?category=immunity" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                🛡️ Immunity Boosters
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-emoji-grid">
              <div className="hero-emoji-card"><span className="emoji">🌿</span><span>Herbs</span></div>
              <div className="hero-emoji-card"><span className="emoji">🍯</span><span>Natural</span></div>
              <div className="hero-emoji-card"><span className="emoji">🧘</span><span>Wellness</span></div>
              <div className="hero-emoji-card"><span className="emoji">💊</span><span>Medicines</span></div>
              <div className="hero-emoji-card"><span className="emoji">🌱</span><span>Organic</span></div>
              <div className="hero-emoji-card"><span className="emoji">✨</span><span>Skincare</span></div>
              <div className="hero-emoji-card"><span className="emoji">🫖</span><span>Teas</span></div>
              <div className="hero-emoji-card"><span className="emoji">🧴</span><span>Oils</span></div>
              <div className="hero-emoji-card"><span className="emoji">❤️</span><span>Health</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <div className="container" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="disclaimer-banner">
          <span className="disclaimer-icon">⚕️</span>
          <div>
            <strong>Medical Disclaimer:</strong> Ayurvedic products are dietary supplements. They are not intended to diagnose, treat, cure, or prevent any disease. 
            Always consult a qualified Ayurvedic practitioner or physician before starting any new supplement regimen.
          </div>
        </div>
      </div>

      {/* Browse by Category */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Browse by Category</h2>
            <p>Find the right Ayurvedic solution for your health needs</p>
            <div className="section-line"></div>
          </div>
          <div className="categories-grid">
            {dbCategories.map(cat => (
              <Link key={cat.id} href={`/products?category=${cat.id}`} className="category-card">
                <span className="cat-emoji">{categoryEmojis[cat.id] || '🩺'}</span>
                <div className="cat-name">{cat.name}</div>
              </Link>
            ))}
            {dbCategories.length === 0 && <span style={{color: "gray"}}>Loading live categories...</span>}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" style={{ background: 'var(--green-50)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <p>Hand-picked Ayurvedic medicines recommended by our experts</p>
            <div className="section-line"></div>
          </div>
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <div className="products-grid">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <Link href="/products" className="btn btn-primary btn-lg">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended by Symptoms */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>🌿 What Are You Looking For?</h2>
            <p>Select your concern and discover Ayurvedic solutions</p>
            <div className="section-line"></div>
          </div>
          <div className="symptoms-grid">
            {SYMPTOMS.map(symptom => (
              <Link key={symptom.name} href={`/products?search=${encodeURIComponent(symptom.search)}`} className="symptom-card">
                <span className="symptom-emoji">{symptom.emoji}</span>
                <div className="symptom-name">{symptom.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Why Choose AyurVeda Store?</h2>
            <div className="section-line"></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
            {[
              { emoji: '✅', title: '100% Authentic', desc: 'All products sourced directly from authorized manufacturers' },
              { emoji: '🚚', title: 'Fast Delivery', desc: 'Free shipping on orders above ₹500. Delivery within 3-5 days' },
              { emoji: '💰', title: 'Best Prices', desc: 'Competitive pricing with regular discounts and offers' },
              { emoji: '🔒', title: 'Secure Payments', desc: 'Multiple payment options with bank-grade security' },
            ].map(item => (
              <div key={item.title} className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: 'var(--space-md)' }}>{item.emoji}</div>
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>{item.title}</h4>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
