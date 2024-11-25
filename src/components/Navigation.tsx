import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Package, Home, User, Settings, LogOut, MapPin } from 'lucide-react';
import { useUserStore } from '../stores/userStore';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const navigation = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { name: 'Entregas', href: '/deliveries', icon: Package },
    { name: 'Perfil', href: '/profile', icon: User },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <MapPin className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-blue-600">Assistente de Delivery</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
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
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center">
              {user?.avatar ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:3001/${user.avatar.replace(/^\/+/, '')}`}
                  alt={user.name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="ml-3 text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="ml-4 p-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
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
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}

            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center px-4">
                {user?.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:3001/${user.avatar.replace(/^\/+/, '')}`}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="ml-3 text-base font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="mt-3 block w-full pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <LogOut className="w-5 h-5 mr-3" />
                  Sair
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}