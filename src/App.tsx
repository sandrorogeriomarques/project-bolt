import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Deliveries } from './pages/Deliveries';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { VerifyCode } from './pages/VerifyCode';
import Restaurants from './pages/admin/Restaurants';
import RestaurantForm from './pages/admin/RestaurantForm';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-code" element={<VerifyCode />} />

        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <Dashboard />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/deliveries" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <Deliveries />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <Profile />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <Settings />
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Rotas de Restaurantes */}
        <Route path="/admin/restaurants" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <Restaurants />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/admin/restaurants/new" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <RestaurantForm />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/admin/restaurants/:id" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <div className="pt-16">
                <RestaurantForm />
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;