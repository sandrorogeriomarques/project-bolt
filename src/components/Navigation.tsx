import { Link } from 'react-router-dom';
import { Home, Package, User, Settings, Store } from 'lucide-react';
import { useUserStore } from '../stores/userStore';

export function Navigation() {
  const user = useUserStore((state) => state.user);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-gray-800">
                Delivery Assistant
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <Link
              to="/deliveries"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Package className="w-5 h-5" />
              <span>Entregas</span>
            </Link>

            <Link
              to="/admin/restaurants"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Store className="w-5 h-5" />
              <span>Restaurantes</span>
            </Link>

            <Link
              to="/profile"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <User className="w-5 h-5" />
              <span>Perfil</span>
            </Link>

            <Link
              to="/settings"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}