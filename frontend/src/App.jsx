import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { Box, CircularProgress } from '@mui/material';

// Lazy loading for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Challenges = lazy(() => import('./pages/Challenges'));
const ChallengeDetail = lazy(() => import('./pages/ChallengeDetail'));
const Friends = lazy(() => import('./pages/Friends'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const Seller = lazy(() => import('./pages/Seller'));
const Admin = lazy(() => import('./pages/Admin'));
const Community = lazy(() => import('./pages/Community'));
const Payment = lazy(() => import('./pages/Payment'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Impact = lazy(() => import('./pages/Impact'));
const Search = lazy(() => import('./pages/Search'));
const OrderReceipt = lazy(() => import('./pages/OrderReceipt'));
const AddressBook = lazy(() => import('./pages/AddressBook'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Quiz = lazy(() => import('./pages/Quiz'));
const NotFound = lazy(() => import('./pages/NotFound'));

const LoadingScreen = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'var(--bg-color)' }}>
    <CircularProgress color="primary" thickness={5} size={60} />
  </Box>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <Navigation />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Protected Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
                <Route path="/challenges/:id" element={<ProtectedRoute><ChallengeDetail /></ProtectedRoute>} />
                <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/seller" element={<ProtectedRoute requiredRole="seller"><Seller /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                <Route path="/community" element={<Community />} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/impact" element={<ProtectedRoute><Impact /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/order/:id/receipt" element={<ProtectedRoute><OrderReceipt /></ProtectedRoute>} />
                <Route path="/addresses" element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />
                <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
