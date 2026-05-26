import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/src/lib/store';
import { clientGetRenovasiSettings, RenovasiSettings } from '@/src/lib/firebaseClient';
import { 
  Menu, X, LayoutDashboard, Package, CalendarDays, 
  Target, Bot, LogOut, Settings, Sun, Moon, Users, Tags, MessageSquare, LogIn, Camera, Hammer, Activity
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import Swal from 'sweetalert2';

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [renovasiSettings, setRenovasiSettings] = useState<RenovasiSettings>({});
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRenovasi = async () => {
      const data = await clientGetRenovasiSettings();
      setRenovasiSettings(data);
    };
    fetchRenovasi();
    
    // Set up an interval or just fetch on location change
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Input Informasi', path: '/informasi', icon: MessageSquare, adminOnly: true },
    { label: 'Inventaris', path: '/inventaris', icon: Package },
    { label: 'Jadwal Piket', path: '/piket', icon: CalendarDays },
    { label: 'Album Kenangan', path: '/album', icon: Camera },
    { label: 'Program Kerja', path: '/proker', icon: Target, adminOnly: true },
    { label: 'Kelola User', path: '/users', icon: Users, adminOnly: true },
    { label: 'Kelola Kategori', path: '/categories', icon: Tags, adminOnly: true },
    { label: 'Bot WhatsApp', path: '/wa-bot', icon: Bot, adminOnly: true },
    { label: 'Renovasi Menu', path: '/renovasi', icon: Hammer, adminOnly: true },
    { label: 'Aktivitas Login', path: '/aktivitas-login', icon: Activity, adminOnly: true },
    { label: 'Pengaturan', path: '/settings', icon: Settings, adminOnly: true },
  ];

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: "Anda akan keluar dari sesi ini.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, logout!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('osim_user');
        setUser(null);
        navigate('/');
      }
    });
  };

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300 relative overflow-hidden",
      theme === 'dark' ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out border-r backdrop-blur-md rounded-r-3xl glass-panel shadow-2xl overflow-hidden flex flex-col",
        theme === 'dark' ? "bg-gray-900/90 border-gray-800" : "bg-white/90 border-gray-100",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700/30">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate cursor-pointer" onClick={() => navigate('/')}>
            Sekretariat OSIM
          </h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.filter(i => !i.adminOnly || user?.role === 'admin').map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80 z-0"></div>
                )}
                <Icon size={20} className="relative z-10" />
                <span className="font-medium relative z-10">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700/30 shrink-0">
           {user ? (
             <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout Admin</span>
            </button>
           ) : (
             <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
            >
              <LogIn size={20} />
              <span className="font-medium">Login Admin</span>
            </button>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-0"
      )}>
        {/* Header */}
        <header className={cn(
          "h-16 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md border-b shrink-0",
          theme === 'dark' ? "bg-gray-950/80 border-gray-800" : "bg-white/80 border-gray-200"
        )}>
           <div className="flex items-center space-x-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl hover:bg-gray-800/50 transition-colors">
               <Menu size={24} />
             </button>
             <h1 className="text-lg font-semibold truncate hidden sm:block">
               {navItems.find(i => i.path === location.pathname)?.label || 'Aplikasi'}
             </h1>
           </div>
           
           <div className="flex items-center space-x-4">
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-800/50 transition-colors">
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-purple-600" />}
             </button>
             {user && (
               <div className="flex items-center space-x-3">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
                   {user.username.charAt(0).toUpperCase()}
                 </div>
                 <div className="hidden md:block text-sm">
                   <p className="font-medium">{user.username}</p>
                   <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                 </div>
               </div>
             )}
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 relative flex flex-col">
             <div className="max-w-7xl mx-auto w-full relative z-10 flex-1">
                {user?.role !== 'admin' && renovasiSettings[location.pathname] ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                      <Hammer size={48} className="text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Sedang Dalam Perbaikan</h2>
                    <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                      Menu ini dalam pengembangan mohon menunggu jika masih begini hingga 3 hari maka hubungi admin
                    </p>
                  </div>
                ) : (
                  <Outlet />
                )}
             </div>

             {user?.role === 'admin' && renovasiSettings[location.pathname] && (
               <div className="fixed bottom-24 lg:bottom-6 right-6 bg-yellow-500 text-yellow-950 px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 z-50 animate-pulse">
                 <Hammer size={16} /> Sedang Direnovasi (Viewer disembunyikan)
               </div>
             )}
             
             {/* Footer */}
             <footer className="w-full text-center mt-12 mb-4 z-10">
               <p className={cn("text-xs sm:text-sm transition-colors", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>
                 © Divisi Sekretariat — Dikembangkan Oleh Gian Aditya
               </p>
             </footer>

             {/* Background glow effects */}
             <div className="fixed top-20 right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
             <div className="fixed bottom-20 left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
      </main>
    </div>
  );
}
