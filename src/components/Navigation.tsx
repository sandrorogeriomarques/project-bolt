import { Link, useNavigate } from 'react-router-dom';
import { Home, Package, User, Settings, Store, LogOut, Menu, X } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function Navigation() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUserStore((state) => ({
    user: state.user,
    logout: state.logout
  }));

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const menuItems = [
    { to: "/dashboard", icon: <Home className="w-5 h-5" />, label: "Home" },
    { to: "/deliveries", icon: <Package className="w-5 h-5" />, label: "Entregas" },
    { to: "/admin/restaurants", icon: <Store className="w-5 h-5" />, label: "Restaurantes" },
    { to: "/profile", icon: <User className="w-5 h-5" />, label: "Perfil" },
    { to: "/settings", icon: <Settings className="w-5 h-5" />, label: "Configurações" },
  ];

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

          {/* Menu para Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>

          {/* Botão do Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="text-red-600 hover:text-red-900 w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}