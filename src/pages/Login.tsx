import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/src/lib/store';
import { clientGetSettings, clientLogin } from '../lib/firebaseClient';
import { Bot, Lock, Code2, Loader2, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginLogo, setLoginLogo] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  React.useEffect(() => {
    clientGetSettings()
      .then(data => {
        if (data.login_logo) setLoginLogo(data.login_logo);
        if (data.nama_sekolah) setNamaSekolah(data.nama_sekolah);
      })
      .catch(e => console.error(e));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const loggedUser = await clientLogin(username, password);
      
      // Cache session in localStorage for local persistence across reloads/devices
      localStorage.setItem('osim_user', JSON.stringify(loggedUser));
      setUser(loggedUser);

      const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: '#1f2937',
          color: '#fff'
      });
      Toast.fire({ icon: "success", title: "Berhasil masuk" });
      navigate('/');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: err.message || 'Username atau password salah',
        background: '#1f2937',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

          <div className="text-center mb-10 mt-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-800/85 border border-gray-700/60 shadow-lg shadow-blue-500/10 mb-4 overflow-hidden">
              {loginLogo ? (
                loginLogo.startsWith('data:') || loginLogo.startsWith('http') ? (
                  <img src={loginLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-4xl select-none">{loginLogo}</span>
                )
              ) : (
                <Bot size={40} className="text-blue-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              Sekretariat OSIM
            </h1>
            <p className="text-gray-400 text-sm">
              {namaSekolah ? `Sistem Informasi Modern ${namaSekolah}` : 'Masuk ke sistem informasi modern'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Code2 size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white transition-all placeholder-gray-600"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-gray-950/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white transition-all placeholder-gray-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Masuk ke Dashboard</span>}
            </button>
          </form>

        </div>
        
        <p className="text-center text-gray-500 text-xs mt-8">
          © Divisi Sekretariat — Dikembangkan Oleh Gian Aditya
        </p>
      </div>
    </div>
  );
}
