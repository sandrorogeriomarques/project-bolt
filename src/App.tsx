import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Deliveries } from './pages/Deliveries';
import { Navigation } from './components/Navigation';
import AdminRestaurants from './pages/admin/Restaurants';
import { RestaurantForm } from './pages/admin/RestaurantForm';
import { useUserStore } from './stores/userStore';
import { Home } from './pages/Home';

function App() {
  const user = useUserStore(state => state.user);

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div>
        <Navigation />
        <main className="mt-16">
          <Routes>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/restaurants/new" element={<RestaurantForm />} />
            <Route path="/admin/restaurants/:id" element={<RestaurantForm />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;