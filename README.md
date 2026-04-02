# Rameshwaram Ayurveda E-Commerce Platform 🌿

A premium, full-stack Ayurvedic e-commerce platform built with Next.js, React, and Prisma. The platform is designed to provide a seamless shopping experience for traditional Ayurvedic medicines, featuring secure authentication, a detailed product catalog, shopping cart functionality, and a dedicated admin panel.

## 🚀 Features

- **Storefront**: Browse over 350+ traditional Ayurvedic medicines organized by category (Immunity, Digestion, Brain Health, etc.).
- **Product Details**: View comprehensive product descriptions, dosages, ingredients, and potential side effects.
- **Authentication**: Secure OTP-based and password-less authentication flow for users.
- **Shopping Cart & Checkout**: Add products to cart and checkout securely.
- **Admin Dashboard**: A secure portal for the owner to track statistics, view recent orders, manage low stock, and dynamically add/edit products.
- **Responsive Aesthetics**: Beautiful UI featuring glassmorphism, dynamic animations, and vibrant typography designed to build trust.

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), React, Vanilla CSS.
- **Backend**: Next.js API Routes.
- **Database**: PostgreSQL (Hosted on Neon) with Prisma ORM.
- **Storage**: Local file integration & Cloudinary support for image assets.
- **Mail/Notifications**: Node Mailer (for OTP functionality).
- **Payment Gateway**: Integration setups available.

## 📦 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Postgres Database (like Neon)

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
   Ensure you have a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@your-host/db?sslmode=require"
   JWT_SECRET="your_secure_jwt_secret"
   SMTP_EMAIL="your_email@gmail.com"
   SMTP_PASSWORD="your_app_password"
   SMTP_FROM_NAME="Rameshwaram Ayurveda"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **Access:** Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Syncing & Scripts

The project includes specialized scripts to heal and sync data states:

- `node scripts/fix-admin.js`: Repairs the core admin account if credentials or roles fail.
- `node scripts/sync-db-images.js`: Scans the `/public/images/product` folder and flawlessly syncs local image paths with the exact product in the database.
- `node scripts/import-products.js`: Imports bulk product records gracefully.

## ⚙️ Architecture Notes (Neon Database Cold-Starts)

The application handles serverless database states. If using the **Neon Free Tier**, the application uses a custom `withNeonRetry()` wrapper around server-side queries. This ensures that when the database enters "sleep mode" after 5 minutes of inactivity, the application will automatically wake it up, preventing hard crashes and connection timeouts.

---
*Developed for Rameshwaram Ayurveda.*
