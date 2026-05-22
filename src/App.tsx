import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/src/lib/store';
import { seedInitialAdmin } from './lib/firebaseClient';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventaris from './pages/Inventaris';
import Piket from './pages/Piket';
import Proker from './pages/Proker';
import WaBot from './pages/WaBot';
import Settings from './pages/Settings';
import Users from './pages/Users';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

export default function App() {
  const { setUser } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Run admin seeding asynchronously so Firestore always has at least 'admin'
        await seedInitialAdmin();

        // Retrieve local storage saved user session
        const savedUser = localStorage.getItem('osim_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem('osim_user');
          }
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [setUser]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
     <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="inventaris" element={<Inventaris />} />
          <Route path="piket" element={<Piket />} />
          <Route path="proker" element={<Proker />} />
          <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="wa-bot" element={<ProtectedRoute adminOnly><WaBot /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
