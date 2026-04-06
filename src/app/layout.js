import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Rameshwaram Ayurveda — Premium Ayurvedic Medicines Online',
  description: 'Shop authentic Ayurvedic medicines from trusted brands at Rameshwaram Ayurveda. Browse immunity boosters, digestive aids, skincare, and more with home delivery.',
  keywords: ['Rameshwaram Ayurveda', 'Ayurvedic medicines', 'herbal remedies', 'natural health', 'immunity', 'digestion', 'skincare'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Rameshwaram Ayurveda',
    title: 'Rameshwaram Ayurveda — Premium Ayurvedic Medicines Online',
    description: 'Shop authentic Ayurvedic medicines from trusted brands at Rameshwaram Ayurveda.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rameshwaram Ayurveda',
    description: 'Shop authentic Ayurvedic medicines.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <a 
              href="https://wa.me/919632324141?text=Hi! I need help with Ayurvedic medicines" 
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-float"
              title="Chat on WhatsApp"
            >
              💬
            </a>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
