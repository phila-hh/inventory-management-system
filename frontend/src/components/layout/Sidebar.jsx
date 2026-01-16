import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Bell, 
  Settings,
  Box,
  FolderOpen,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/users', icon: Users, label: 'Users', adminOnly: true },
  { path: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  
  
  console.log('Sidebar - Current user:', user);
  console.log('Sidebar - Is admin:', isAdmin());

  return (
    <div className="w-64 bg-slate-800 flex flex-col">
      {}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Box className="w-8 h-8 text-emerald-400" />
        <span className="ml-3 text-xl font-bold text-white">
          StockFlow
        </span>
      </div>

      {}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          
          if (item.adminOnly && !isAdmin()) {
            return null;
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="ml-3 font-medium">{item.label}</span>
              {item.adminOnly && (
                <span className="ml-auto text-xs bg-amber-500 text-slate-900 px-2 py-0.5 rounded font-semibold">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          StockFlow Inventory v1.0
        </div>
      </div>
    </div>
  );
}
