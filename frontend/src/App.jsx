import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from './components/ui/toaster';


import { authService } from './services/auth.service';
import { socketService } from './services/socket.service';


import { AuthProvider, useAuth } from './contexts/AuthContext';


import Layout from './components/layout/Layout';


import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Profile from './pages/Profile';


import Chatbot from './components/Chatbot';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, 
    },
  },
});


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}


function SocketConnection() {
  useEffect(() => {
    try {
      const user = authService.getUser();
      if (user) {
        socketService.connect(user._id);
      }
    } catch (error) {
      console.warn('Socket connection failed:', error);
    }

    return () => {
      try {
        socketService.disconnect();
      } catch (error) {
        console.warn('Socket disconnect failed:', error);
      }
    };
  }, []);

  return null;
}


function useRealtimeUpdates() {
  useEffect(() => {
    try {
      socketService.onInventoryUpdate((data) => {
        console.log('Inventory updated:', data);
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      });

      socketService.onNewAlert((alert) => {
        console.log('New alert:', alert);
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      });

      socketService.onOrderCreated((order) => {
        console.log('Order created:', order);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      });
    } catch (error) {
      console.warn('Real-time updates unavailable:', error);
    }

    return () => {
      try {
        socketService.offInventoryUpdate();
        socketService.offNewAlert();
        socketService.offOrderCreated();
      } catch (error) {
        console.warn('Socket cleanup failed:', error);
      }
    };
  }, []);
}

function AppContent() {
  useRealtimeUpdates();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <SocketConnection />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <ShadcnToaster />
      <Router>
        <Routes>
          {}
          <Route path="/login" element={<Login />} />

          {}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {}
        {isAuthenticated && <Chatbot />}
      </Router>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
