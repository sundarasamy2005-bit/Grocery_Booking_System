# Local Grocery Booking System

A complete, production-ready full-stack web application that connects customers with nearby local grocery shops. It allows customers to discover shops, browse products, and place Cash on Delivery (COD) orders via home delivery or store pickup.

## Features

### 👤 Customer
- **Authentication**: Email/password and Google login via Firebase.
- **Shop Discovery**: Find nearby shops sorted by Haversine distance using Geolocation.
- **Product Browsing**: Filter by categories, view stock availability.
- **Cart & Checkout**: Cart state sync, handle minimum order amounts, and place COD orders.
- **Order Tracking**: Timeline-based order history (Placed, Preparing, Ready, Delivered).

### 🏪 Shop Owner
- **Dashboard**: Track daily revenue, total orders, and active orders.
- **Order Management**: Accept, reject, and update the status of incoming orders.
- **Product Management**: Full CRUD for products, set prices and stock limits, upload product images.
- **Shop Profile**: Control delivery/pickup preferences, exact map coordinates, and upload a banner image.

### 🛡️ Admin
- **Platform Analytics**: Global dashboard summarizing users, shops, products, and revenue.
- **Approvals**: Review and approve/suspend shop applications.
- **User Management**: View user lists and assign roles.
- **Categories**: Create and manage global product categories.

---

## Technology Stack

- **Frontend**: React.js (Vite), TypeScript, Tailwind CSS v4, Zustand, React Router, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, TypeScript, REST API gateway.
- **AI & Analytics Service**: Python 3.13, FastAPI, Pandas, NumPy, Scikit-learn, PyMongo, Uvicorn (Port 8000).
- **Database**: MongoDB Atlas & Mongoose (with geospatial support).
- **Authentication**: Firebase Authentication + Firebase Admin SDK for backend ID token verification.
- **Image Storage**: Cloudinary (Multipart memory streams).
- **Email Notifications**: Nodemailer + Gmail SMTP & Python Automated 11:00 PM Daily AI Report.
- **Security & Performance**: Helmet, CORS, Compression, express-rate-limit.

---

## 🚀 Quick Start / Local Development

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas cluster (or local MongoDB)
- Firebase project
- Cloudinary account

### 2. Clone and Install
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

#### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Firebase Admin SDK (Download your Service Account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail / Nodemailer
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_digit_app_password
```

#### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (get these from your Firebase Web App config):
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Seed Database (Optional)
Populate your database with starter categories, products, and a sample admin/shop-owner account:
```bash
cd backend
npm run seed
```

### 5. Run the Application
Start both development servers concurrently:

**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 📦 Deployment (Render)

This project is structured perfectly for deployment on platforms like Render.

### Backend Deployment (Render Web Service)
1. Set Build Command: `npm install && npm run build`
2. Set Start Command: `npm start`
3. Add all variables from `backend/.env` into Render's Environment Variables panel.

### Frontend Deployment (Render Static Site / Vercel)
1. Set Build Command: `npm install && npm run build`
2. Set Publish Directory: `dist`
3. Add all variables from `frontend/.env` into the Environment Variables panel.

*Note: The frontend is configured with a Vite proxy to `/api` for local development. In production, ensure Axios (`src/services/api.ts`) hits your deployed backend URL.*

---

## Security Highlights
- **Strict Role-Based Access Control**: `requireRole('shopOwner', 'admin')` middleware blocks unauthorized API requests.
- **Firebase Token Verification**: Passwords are never sent to the backend. The backend validates JWTs directly with Google's servers.
- **Server-Side Pricing**: The frontend never dictates the final cart price. The backend strictly recalculates totals using current DB prices, preventing tampering.
- **Atomic Transactions**: MongoDB Transactions are utilized during Checkout to deduct stock and clear the user cart atomically, preventing race conditions or double-spending stock.
