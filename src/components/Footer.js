import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Image src="/logo.png" alt="Rameshwaram Ayurveda" width={64} height={64} style={{ objectFit: 'contain' }} />
          </div>
          <p>Your trusted online destination for authentic Ayurvedic medicines and natural wellness products.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <Link href="/products">All Products</Link>
          <Link href="/products?category=immunity">Immunity Boosters</Link>
          <Link href="/products?category=digestion">Digestive Health</Link>
          <Link href="/products?category=skincare">Skincare</Link>
          <Link href="/products?category=pain-relief">Pain Relief</Link>
        </div>

        <div className="footer-section">
          <h4>Customer Care</h4>
          <Link href="/account">My Account</Link>
          <Link href="/cart">Shopping Cart</Link>
          <Link href="/orders">Track Order</Link>
          <Link href="/refund-policy">Refund &amp; Returns</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <a href="tel:+919632324141">📞 +91 96323 24141</a>
          <a href="mailto:rameshwaramayurveda25@gmail.com">✉️ rameshwaramayurveda25@gmail.com</a>
          <a href="https://maps.google.com/?q=52+Rameshwaram+Indra+Nagar+Bareilly+UP" target="_blank" rel="noopener noreferrer">
            📍 52, Rameshwaram, Indra Nagar, Bareilly, UP 243001
          </a>
          <a href="https://wa.me/919632324141?text=Hi! I need help with Ayurvedic medicines" target="_blank" rel="noopener noreferrer">💬 WhatsApp Support</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Rameshwaram Ayurveda. All rights reserved. | Ayurvedic products should be taken under guidance of a qualified practitioner.</p>
        <p style={{ marginTop: '8px', opacity: 0.7 }}>
          <Link href="/privacy-policy" style={{ color: 'inherit', textDecoration: 'underline', marginRight: '16px' }}>Privacy Policy</Link>
          <Link href="/terms-and-conditions" style={{ color: 'inherit', textDecoration: 'underline', marginRight: '16px' }}>Terms &amp; Conditions</Link>
          <Link href="/refund-policy" style={{ color: 'inherit', textDecoration: 'underline' }}>Refund Policy</Link>
        </p>
      </div>
    </footer>
  );
}
