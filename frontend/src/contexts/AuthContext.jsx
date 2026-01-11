import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          
          const response = await api.get('/auth/check-token');
          const userData = {
            _id: response.data._id,
            username: response.data.username,
            name: response.data.name,
            role: response.data.role,
          };
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          console.log('✅ Auth verified, user:', userData);
        } catch (error) {
          
          console.log('❌ Token invalid, clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      
      const userData = authService.getUser();
      setUser(userData);
      return { success: true, data: response, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const register = async (name, username, password, role = 'staff') => {
    try {
      await authService.signUp({ name, username, password, role });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
