import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, User, ChevronDown, UserCog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { alertsService } from '../../services/alerts.service';

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-alerts-count'],
    queryFn: () => alertsService.getUnreadCount(),
    refetchInterval: 30000, 
  });

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-slate-800">
          Welcome back, {user?.name || 'User'}!
        </h2>
      </div>

      {}
      <div className="flex items-center space-x-4">
        {}
        <button className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-800">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <button
                onClick={handleProfile}
                className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <UserCog className="w-4 h-4 mr-3" />
                Edit Profile
              </button>
              <div className="border-t border-slate-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
