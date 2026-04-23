# Rameshwaram Ayurveda E-Commerce Platform 🌿

A premium, full-stack Ayurvedic e-commerce platform built with **Next.js 14**, **React**, and **MongoDB**. This platform provides a seamless shopping experience for traditional Ayurvedic medicines, featuring secure authentication, a dynamic product catalog, and a robust admin management system.

## 🚀 Key Features

- **Storefront**: Browse a curated catalog of 350+ traditional Ayurvedic medicines organized by category and brand.
- **Dynamic Filtering**: Advanced discovery system allowing users to filter by Category (Immunity, Digestion, etc.) and Brand, with options fetched dynamically from the database.
- **Authentication**: Secure registration and login flow utilizing **bcrypt** password hashing paired with a **One-Time Password (OTP)** verification system for verified accounts.
- **High-Performance Media**: Optimized image delivery powered by **Cloudinary**, featuring deterministic asset management and responsive loading.
- **Secure Payments**: Integrated with **Razorpay** for a reliable and localized checkout experience.
- **Admin Dashboard**: A centralized command center for tracking order statistics, managing inventory, and performing real-time CRUD operations on products.
- **Architecture**: Clean, decoupled architecture using a **Service Layer** pattern to separate business logic from API routes.
- **Aesthetics**: Premium UI design using glassmorphism, modern typography (Inter/Outfit), and smooth micro-animations.

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Styling**: Vanilla CSS (Custom Design System)
- **Media Hosting**: [Cloudinary](https://cloudinary.com/)
- **Payment Gateway**: [Razorpay](https://razorpay.com/)
- **Validation**: [Zod](https://zod.dev/) for type-safe API schemas
- **Notifications**: [NodeMailer](https://nodemailer.com/) (OTP Delivery)
- **Monitoring**: [@vercel/analytics](https://vercel.com/analytics)

## 📦 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Instance (Atlas or Local)
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
   Create a `.env` file in the root directory and populate it based on `.env.example`.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access:** Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Project Structure

- `src/app/api`: Clean API routes with Zod validation.
- `src/services`: Decoupled business logic (Orders, Products, Users).
- `src/models`: Mongoose schemas for data persistence.
- `src/lib`: Core utilities (Cloudinary, DB Connection, OTP Mailer).
- `src/components`: Modular UI components with a custom design system.

## 🔒 Security & Performance

- **Rate Limiting**: Integrated protection against API abuse.
- **Deterministic Images**: Automatic slug-based image naming for Cloudinary consistency.
- **Schema Validation**: All incoming requests are validated using Zod to prevent malformed data.
- **Vercel Analytics**: Real-time performance monitoring and user insights.

---
*Developed for Rameshwaram Ayurveda.*

