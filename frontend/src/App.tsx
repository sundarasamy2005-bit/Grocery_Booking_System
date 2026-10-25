import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Layouts
// import MainLayout from './components/layout/MainLayout';
// import AdminLayout from './components/layout/AdminLayout';
// import ShopOwnerLayout from './components/layout/ShopOwnerLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import Home from './pages/customer/Home';
import ShopList from './pages/customer/ShopList';
import ShopDetails from './pages/customer/ShopDetails';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import ProductDetails from './pages/customer/ProductDetails';
import Favourites from './pages/customer/Favourites';
import Profile from './pages/customer/Profile';
import HelpSupport from './pages/customer/HelpSupport';
import Settings from './pages/customer/Settings';
import ShopOwnerLayout from './pages/shopOwner/ShopOwnerLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AppSplashScreen from './components/common/AppSplashScreen';

const App = () => {
  const { syncUser, isAuthenticated, user } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUser();
      } else {
        useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, [syncUser]);

  if (showSplash) {
    return (
      <AppSplashScreen
        onComplete={() => {
          setShowSplash(false);
          useAuthStore.setState({ isLoading: false });
        }}
      />
    );
  }

  const getHomeForRole = (role?: string) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'shopOwner') return '/shop/dashboard';
    return '/';
  };

  return (
    <Router>
      <Routes>
        {/* Public / Auth Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to={getHomeForRole(user?.role)} replace />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to={getHomeForRole(user?.role)} replace />}
        />

        {/* Customer / Role-Aware Home Route */}
        <Route
          path="/"
          element={
            isAuthenticated && user?.role === 'shopOwner' ? (
              <Navigate to="/shop/dashboard" replace />
            ) : isAuthenticated && user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Home />
            )
          }
        />
        <Route path="/landing" element={<Home />} />
        <Route path="/shops" element={<ShopList />} />
        <Route path="/shops/:shopId" element={<ShopDetails />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/favourites" element={<Favourites />} />
        <Route path="/favorites" element={<Favourites />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/support" element={<HelpSupport />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Shop Owner Routes (Accessible to shopOwner and admin monitoring) */}
        <Route
          path="/shop/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : user?.role === 'shopOwner' || user?.role === 'admin' ? (
              <ShopOwnerLayout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        {/* Admin Routes (Admin role only) */}
        <Route
          path="/admin/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : user?.role === 'admin' ? (
              <AdminLayout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
