import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Package, Home, User, Settings, LogOut, MapPin, Store } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { getAvatarUrl } from '../utils/getAvatarUrl';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const navigation = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { name: 'Entregas', href: '/deliveries', icon: Package },
    { name: 'Restaurantes', href: '/admin/restaurants', icon: Store },
    { name: 'Perfil', href: '/profile', icon: User },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow">
      {/* Desktop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <MapPin className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-blue-600">Assistente de Delivery</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      inline-flex items-center px-1 pt-1 text-sm font-medium
                      ${location.pathname === item.href
                        ? 'border-b-2 border-blue-500 text-gray-900'
                        : 'text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative flex items-center gap-4">
              {user?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={getAvatarUrl(user.avatar)}
                  alt="Avatar"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    block pl-3 pr-4 py-2 border-l-4 text-base font-medium
                    ${location.pathname === item.href
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}