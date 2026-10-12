import { useEffect } from 'react';
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
import ShopOwnerLayout from './pages/shopOwner/ShopOwnerLayout';
import AdminLayout from './pages/admin/AdminLayout';

// Placeholder Components
const LoadingScreen = () => <div className="min-h-screen flex items-center justify-center">Loading...</div>;
const Placeholder = ({ name }: { name: string }) => <div className="p-8"><h1>{name}</h1></div>;

const App = () => {
  const { syncUser, setLoading, isLoading, isAuthenticated, user } = useAuthStore();

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

  if (isLoading) {
    return <LoadingScreen />;
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
        <Route path="/shops" element={<ShopList />} />
        <Route path="/shops/:shopId" element={<ShopDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        
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
