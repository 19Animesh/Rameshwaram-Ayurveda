import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Rameshwaram Ayurveda — Premium Ayurvedic Medicines Online',
  description: 'Shop authentic Ayurvedic medicines from trusted brands at Rameshwaram Ayurveda. Browse immunity boosters, digestive aids, skincare, and more with home delivery.',
  keywords: 'Rameshwaram Ayurveda, Ayurvedic medicines, herbal remedies, natural health, immunity, digestion, skincare',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
      </body>
    </html>
  );
}
