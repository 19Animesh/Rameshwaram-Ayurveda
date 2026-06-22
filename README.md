# Rameshwaram Ayurveda E-Commerce Platform 🌿

A premium, production-ready, full-stack Ayurvedic e-commerce platform built with **Next.js 14**, **React**, and **MongoDB**. This platform provides a seamless, mobile-friendly shopping experience for traditional Ayurvedic medicines, featuring secure authentication, server-verified payments, a dynamic product catalog, and a robust admin dashboard.

---

## 🚀 Key Features

### 🛒 Storefront & Catalogue
- **Curated Selection:** Browse over 350+ traditional Ayurvedic medicines organized dynamically by categories and brands.
- **Dynamic Filtering:** Advanced discovery system allowing users to filter by Category and Brand, with real-time options fetched directly from the database.
- **Mobile-Friendly Layout:** Dynamic, collapsible mobile filter sidebar ensuring products remain highly visible and accessible on small screens.

### 🔒 Secure Authentication & User Accounts
- **SMS OTP Verification:** Secure sign-in and sign-up flow utilizing Firebase Authentication Client SDK for One-Time Password (OTP) validation.
- **Unified Profile:** Manage account details, track past orders, and view delivery addresses automatically derived from checkout history.

### 💳 Localized Checkout & Payments
- **Razorpay Integration:** Fast, secure, and native payment gateway integration for frictionless transactions.
- **Server-Side Verification:** Cryptographically verifies payment signatures and recalculates totals directly in Next.js API endpoints before capturing and confirming orders to prevent client-side price tampering.

### 📊 Admin Panel & Management
- **Interactive Dashboard:** Track sales, monitor real-time order states, and analyze category distributions.
- **Horizontal Navigation:** Fully responsive admin sidebar that adapts into a sleek top tab navigation bar on mobile and tablet devices.
- **Inventory Controls:** Fast inline stock management, product CRUD controls, and real-time low-stock alerts.

### 🎨 Premium Aesthetics
- **Modern Typography & Layout:** Styled using curated, harmonious CSS palettes, Google Fonts (Inter/Outfit), glassmorphism, and smooth micro-animations.
- **Optimized Media:** Responsive and deferred image loading with blur-up placeholders powered by Cloudinary.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Styling:** Vanilla CSS (Custom Design System with responsive media query grid)
- **Auth Provider:** [Firebase Auth](https://firebase.google.com/docs/auth) (Client-side SMS OTP confirmation)
- **Media Hosting:** [Cloudinary](https://cloudinary.com/) (Deterministic image optimization)
- **Payment Gateway:** [Razorpay](https://razorpay.com/)
- **Validation:** [Zod](https://zod.dev/) for type-safe API schemas
- **Monitoring:** [@vercel/analytics](https://vercel.com/analytics)

---

## 🔒 Security & Performance

- **Rate Limiting:** Protection against API abuse and brute-force attempts on sensitive authentication endpoints.
- **Security Headers:** Fully configured Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Frame-Options (DENY), and X-Content-Type-Options (nosniff) inside `next.config.mjs`.
- **Validation Layer:** Robust API route input sanitization and Zod parsing preventing NoSQL injection and ReDoS vulnerabilities (capped inputs).
- **SEO & Accessibility:** Structured semantic HTML5 elements, unique testing IDs, `robots.txt` crawler guards, and standard dynamic `sitemap.xml`.

---

## 📦 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Instance (Atlas or Local)
- Firebase Project Setup (for Phone OTP authentication)
- Cloudinary Account
- Razorpay API Keys

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/19Animesh/Rameshwaram-Ayurveda.git
   cd Rameshwaram-Ayurveda
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and populate it based on `.env.example`. Make sure to fill in all API secrets and environment constants.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access:** Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

## ⚙️ Project Structure

- `src/app/api`: Clean API routes with schema-based Zod input validations.
- `src/services`: Decoupled business logic (Orders, Products, Users) following the Service Layer pattern.
- `src/models`: Mongoose schemas for data persistence.
- `src/lib`: Core utilities (Cloudinary, DB Connection, Auth helpers, Constants).
- `src/components`: Modular UI components with responsive CSS (Header with mobile navigation drawer, ProductCard variants, Admin Tables).

---
*Developed for Rameshwaram Ayurveda.*
