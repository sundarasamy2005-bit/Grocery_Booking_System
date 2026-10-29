# 🛒 LocalGrocery — Hyper-Local Multi-Vendor Grocery Marketplace

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%205-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase%20Authentication-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Python](https://img.shields.io/badge/AI%20Service-FastAPI%20%2B%20Scikit--Learn-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

---

## 📌 Executive Overview

**LocalGrocery** is a full-stack, hyper-local multi-vendor grocery booking and delivery platform designed to empower neighborhood grocery stores and supermarkets. It bridges local merchants with residential customers, offering instantaneous doorstep delivery and quick in-store pickup with real-time inventory management, multi-weight pack sizing, and live order tracking.

The platform provides role-tailored workspaces for **Customers**, **Shop Owners (Merchants)**, and **Super Admins**, backed by an Express 5 REST API, a Python AI predictive analytics service, and MongoDB Atlas.

---

## 📸 Application Outputs & Live Previews

### 1. 🛍️ Customer Storefront Portal
*Mobile-first, responsive shopping interface featuring delivery location selection, categorized browsing, real-time search autocomplete, promotional highlights, and flexible weight/pack size selection.*

![Customer Storefront](docs/screenshots/customer-storefront.png)

---

### 2. 🏪 Shop Owner (Merchant) Workspace
*Merchant command center with real-time revenue counters, active fulfillment queue, and the interactive **Day by Day Sales Velocity** analytics chart.*

![Merchant Dashboard](docs/screenshots/merchant-dashboard.png)

---

### 3. 🛡️ Super Admin Control Center
*Executive platform oversight tracking registered users, merchant applications awaiting review, active stores, gross delivered GMV, catalog products, and system health.*

![Admin Portal](docs/screenshots/admin-portal.png)

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT FRONTEND (React 19)                       │
│  Vite + TypeScript + Tailwind CSS v4 + Zustand + Leaflet + Lucide      │
│  • Customer Storefront  • Merchant Workspace  • Super Admin Dashboard  │
└──────────────┬─────────────────────────┬───────────────────────────────┘
               │ (REST / JSON)           │ (Firebase Auth Tokens)
               ▼                         ▼
┌───────────────────────────────┐ ┌──────────────────────────────────────┐
│       EXPRESS BACKEND         │ │           EXTERNAL SERVICES          │
│  Node.js + Express 5 + TS     │ │  • Firebase Authentication           │
│  • Auth Middleware (RBAC)     │ │  • Cloudinary (Media CDN)            │
│  • Order State Machine        │ │  • OpenStreetMap / Leaflet (Maps)    │
│  • Cart Synchronization       │ │  • Nodemailer (Order Receipts)       │
│  • Server-Side Pricing Guard  │ └──────────────────────────────────────┘
└───────┬───────────────┬───────┘
        │               │
        ▼ (Mongoose)    ▼ (Internal REST / Port 8000)
┌──────────────┐ ┌──────────────────────────────────────────────────────┐
│   DATABASE   │ │               FASTAPI AI SERVICE                     │
│   MongoDB    │ │  Python 3.11+ • Scikit-learn • Pandas • PyMongo      │
│    Atlas     │ │  • Demand Forecasting  • Restock Prediction Engine   │
└──────────────┘ └──────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features by Portal

### 👤 1. Customer Storefront
- **Hyper-Local Geolocation Discovery**: Automatically detects customer GPS coordinates and uses the Haversine formula via OpenStreetMap & Leaflet to calculate distances to nearby local stores.
- **Global Autocomplete Search**: Instant search across all products, grocery categories, and local shops.
- **Multi-Weight & Pack Size Selector**: Customers can select from multiple weight variations (e.g., 100g, 250g, 500g, 1kg, 2kg, 5kg), each with distinct pricing and stock tracking.
- **Hybrid Cart Engine**:
  - **Guest Cart**: Unregistered users can freely add items, modify quantities, and inspect subtotals in persistent `localStorage`.
  - **Auto-Sync on Login**: Seamlessly merges guest cart items into the remote database cart upon Firebase authentication.
  - **Single-Merchant Conflict Guard**: Alerts users if they add items from a different shop, offering a 1-click modal to switch shops or keep their current cart.
- **Flexible Fulfillment & COD**: Supports **Home Delivery** and **In-Store Pickup** with Cash on Delivery (COD).
- **Live Order Timeline**: Real-time status tracker (`Placed` ➔ `Accepted` ➔ `Preparing` ➔ `Out for Delivery` / `Ready for Pickup` ➔ `Delivered`).
- **Address Book Manager**: Save multiple delivery addresses (Home, Work, Other) with 6-digit Indian PIN code validation and GPS map pinning.
- **Favourites & Wishlist**: Bookmark frequently purchased everyday essentials for rapid reordering.

---

### 🏪 2. Shop Owner (Merchant) Portal
- **Executive KPI Dashboard**: Live monitoring of Today's Revenue, Today's Order Count, Active Fulfillment Queue, and Total Lifetime Orders.
- **Sales Velocity Visualizer**: Interactive day-by-day sales revenue and volume graphs with dynamic tooltips and performance breakdown.
- **Product & Inventory Management**: Complete CRUD operations for grocery items, multiple image uploads via Cloudinary, multi-pack variants, category assignment, and low-stock alerts.
- **Order Fulfillment Pipeline**: Step-by-step order actions:
  $$\text{Incoming Order} \longrightarrow \text{Accept} / \text{Reject} \longrightarrow \text{Preparing} \longrightarrow \text{Dispatched} \longrightarrow \text{Delivered}$$
- **Shop Profile & Geofencing**: Configure store operational hours, minimum order values, delivery radius, shop banner, and physical map coordinates.
- **Shop Automation Engine**: Set rules for automated order acceptance, notification thresholds, and status transitions.
- **AI Analytics & Restock Predictor**: Intelligent replenishment forecasts based on previous sales velocities and demand trends.

---

### 🛡️ 3. Super Admin Portal
- **Platform-Wide Analytics**: Real-time counters for Registered Users, Active Merchants, Gross Delivered GMV (₹), Catalog Products, and Cancelled/Returned orders.
- **Merchant Onboarding & Verification**: Review incoming merchant applications, verify store licenses/details, and Approve or Suspend storefronts.
- **User Role Management**: Search user accounts and promote/demote roles between `customer`, `shopOwner`, and `admin`.
- **Global Category Management**: Create, edit, and organize product taxonomy with custom SVG icons and auto-slugified URL paths.
- **System-Wide Order Oversight**: Full platform order audit log for conflict resolution and delivery dispute monitoring.

---

## 🗄️ Database Schemas & Data Models

The system is powered by 9 strongly typed Mongoose models in MongoDB Atlas:

| # | Model | Key Fields & Responsibilities |
|---|---|---|
| 1 | **`User`** | Firebase UID, email, role (`customer`, `shopOwner`, `admin`), phone, delivery addresses, favourites array. |
| 2 | **`Shop`** | Owner reference, store name, description, logo & banner images, GeoJSON Point coordinates, operational status (`PENDING`, `APPROVED`, `REJECTED`), delivery radius, min order amount. |
| 3 | **`Product`** | Shop ref, category ref, title, description, base price, stock, unit options, **pack variants array** (`variantId`, `label`, `price`, `originalPrice`, `stock`), image URLs, active status. |
| 4 | **`Category`** | Name, unique slug, icon identifier, display order, active status. |
| 5 | **`Cart`** | User ref, single-vendor `shopId` enforcement, items array with variant snapshots (`variantId`, `variantLabel`, `variantPrice`, `quantity`), subtotal. |
| 6 | **`Order`** | Customer ref, shop ref, snapshot of purchased items & variants, fulfillment type (`DELIVERY`, `PICKUP`), delivery address, payment method (`COD`), payment status, order status timeline (`PLACED`, `ACCEPTED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`). |
| 7 | **`Address`** | User ref, recipient name, phone, address line, landmark, city, state, 6-digit Indian pincode, coordinates, default flag. |
| 8 | **`Review`** | Product ref, shop ref, customer ref, rating (1–5 stars), comment, verified purchase flag. |
| 9 | **`ShopAutomation`** | Shop ref, auto-accept toggle, max daily order thresholds, low-stock trigger rules, notification preferences. |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router v7, React Hook Form, Zod, Leaflet, Lucide Icons |
| **Backend API** | Node.js, Express 5, TypeScript, Mongoose 9, Firebase Admin SDK, Multer, Cloudinary SDK, Nodemailer, Helmet, CORS, Compression |
| **AI & Insights Service** | Python 3.11+, FastAPI, Uvicorn, Scikit-learn, Pandas, NumPy, PyMongo |
| **Database & Cache** | MongoDB Atlas (Geospatial 2dsphere indexes, Atomic Multi-Document Transactions) |
| **Authentication** | Firebase Authentication (Email/Password & Google OAuth) with backend JWT signature verification |
| **Media Delivery** | Cloudinary Image CDN with automated resizing and format optimization |

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.11 or higher (optional, for AI Service)
- **MongoDB Atlas**: Free tier or local MongoDB instance
- **Firebase Project**: For Authentication and Service Account credentials
- **Cloudinary Account**: For media asset storage

---

### 2. Repository Setup

```bash
# Clone the repository
git clone https://github.com/your-username/grocery.git
cd grocery
```

---

### 3. Environment Variables Configuration

#### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/grocery?retryWrites=true&w=majority

# Firebase Admin SDK (From Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Cloudinary (Media CDN)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Nodemailer / Gmail SMTP (For Order Confirmation Emails)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

#### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx
```

#### AI Service Configuration (`ai-service/.env`) *(Optional)*
Create a `.env` file in the `ai-service/` directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/grocery?retryWrites=true&w=majority
PORT=8000
```

---

### 4. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install AI Service dependencies (optional)
cd ../ai-service
pip install -r requirements.txt
```

---

### 5. Seed the Database

Populate initial categories, sample stores, and authentic products:

```bash
cd backend

# Seed default categories and starter products
npm run seed

# (Optional) Seed 200+ multi-category supermarket products
npm run seed:200

# (Optional) Seed farm-fresh fruits & vegetables catalog
npm run seed:fruits
```

---

### 6. Run the Application

Open separate terminal windows for each service:

**Terminal 1 — Backend API**:
```bash
cd backend
npm run dev
# Starts Express 5 API on http://localhost:5000
```

**Terminal 2 — Frontend Client**:
```bash
cd frontend
npm run dev
# Starts Vite React 19 dev server on http://localhost:5173 (or http://localhost:5174)
```

**Terminal 3 — AI Analytics Service** *(Optional)*:
```bash
cd ai-service
uvicorn app:app --reload --port 8000
# Starts FastAPI prediction server on http://localhost:8000
```

Visit **`http://localhost:5173`** in your browser to start shopping!

---

## 🔒 Security & Data Integrity

1. **Role-Based Access Control (RBAC)**: Strict server-side route guards verify decoded Firebase JWT claims before granting access to Merchant (`shopOwner`) or `admin` endpoints.
2. **Server-Side Price Validation**: The frontend cart never dictates order item prices. During checkout, unit and variant prices are re-fetched directly from the database to eliminate client tampering.
3. **Atomic Stock Decrementing**: MongoDB transactions (`session.withTransaction`) atomically deduct inventory and clear the active cart, preventing double-sell race conditions.
4. **Single-Store Multi-Vendor Guard**: Prevents cart item pollution across different merchants, ensuring clean logistics and single-origin delivery dispatch.
5. **Sanitization & Rate Limiting**: Express APIs are shielded with Helmet security headers, compression, CORS policies, and rate-limiting to mitigate brute-force and DDoS vectors.

---

## 📦 Production Build & Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Generates optimized static production bundle in dist/
```

### Build Backend
```bash
cd backend
npm run build
# Compiles TypeScript into dist/
npm start
# Runs compiled Node.js server
```

---

## 📄 License

This project is licensed under the **ISC License**. Open-source for local community commerce and educational exploration.
