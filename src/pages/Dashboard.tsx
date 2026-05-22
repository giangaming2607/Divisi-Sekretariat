import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/lib/store';
import { Users, Package, CalendarDays, Target, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { 
  clientGetInventaris, 
  clientGetProker, 
  clientGetPiket, 
  clientGetUsers,
  InventarisItem,
  ProkerItem,
  PiketItem
} from '../lib/firebaseClient';

interface User {
  id: number;
  username: string;
  role: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real Firestore States
  const [inventarisCount, setInventarisCount] = useState<number>(0);
  const [prokerActiveCount, setProkerActiveCount] = useState<number>(0);
  const [piketCount, setPiketCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  
  const [piketToday, setPiketToday] = useState<PiketItem[]>([]);
  const [prokersActive, setProkersActive] = useState<ProkerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [inventaris, prokers, pikets, users] = await Promise.all([
          clientGetInventaris(),
          clientGetProker(),
          clientGetPiket(),
          clientGetUsers()
        ]);

        // 1. Calculate count totals
        setInventarisCount(inventaris.length);
        const activeProkers = prokers.filter(p => p.status === 'Berjalan');
        setProkerActiveCount(activeProkers.length);
        setPiketCount(pikets.length);
        setUserCount(users.length);

        // 2. Fetch pikets for today (e.g. "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")
        const currentDayName = format(new Date(), 'EEEE', { locale: id });
        const filteredPiketToday = pikets.filter(
          p => p.hari.toLowerCase() === currentDayName.toLowerCase()
        );
        setPiketToday(filteredPiketToday);

        // 3. active proker list
        setProkersActive(activeProkers);
      } catch (err) {
        console.error('Error fetching dashboard states:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    { label: 'Total Inventaris', value: String(inventarisCount), icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Proker Berjalan', value: String(prokerActiveCount), icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Petugas Piket', value: String(piketCount), icon: CalendarDays, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'User Aktif', value: String(userCount), icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const handleShowProkerDetail = (item: ProkerItem) => {
    Swal.fire({
      title: item.nama,
      html: `
        <div class="text-left space-y-4">
          <div class="p-4 bg-gray-950 border border-gray-800 rounded-2xl">
            <span class="block text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1">Penjelasan / Deskripsi</span>
            <p class="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">${item.deskripsi || 'Tidak ada deskripsi yang tersedia untuk program kerja ini.'}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-950 border border-gray-800 rounded-2xl">
              <span class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tanggal Mulai</span>
              <span class="text-xs text-white font-mono flex items-center gap-1">📅 ${item.tanggal_mulai}</span>
            </div>
            <div class="p-3 bg-gray-950 border border-gray-800 rounded-2xl">
              <span class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tanggal Selesai</span>
              <span class="text-xs text-white font-mono flex items-center gap-1">📅 ${item.tanggal_selesai}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-950 border border-gray-800 rounded-2xl">
              <span class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Penanggung Jawab (PJ)</span>
              <span class="text-xs text-white font-semibold flex items-center gap-1">👤 ${item.pj}</span>
            </div>
            <div class="p-3 bg-gray-950 border border-gray-800 rounded-2xl">
              <span class="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status Proker</span>
              <span class="text-xs font-bold text-blue-400">⏳ ${item.status || 'Berjalan'}</span>
            </div>
          </div>
        </div>
      `,
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#9333ea',
      confirmButtonText: 'Tutup Detail',
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Selamat datang, {user?.username}! 👋</h2>
          <p className="text-blue-100 max-w-xl">
            Sistem informasi manajemen Sekretariat OSIM. Kelola inventaris, program kerja, dan jadwal kegiatan dengan mudah.
          </p>
          <div className="mt-8 flex items-center space-x-2 bg-black/20 w-fit px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
             <Activity className="text-blue-300 animate-pulse" size={18} />
             <span className="font-mono">{format(currentTime, 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id })}</span>
          </div>
        </div>
        
        {/* Decor */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-colors group-hover:scale-110 duration-300`}>
                  <Icon size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold dark:text-white text-gray-900">{loading ? '...' : stat.value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid Layout for Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Today's Piket Card */}
         <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
              <CalendarDays className="text-emerald-500" size={20} /> Jadwal Piket Hari Ini ({format(new Date(), 'EEEE', { locale: id })})
            </h3>
            {loading ? (
              <div className="flex justify-center items-center h-48 text-gray-500">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : piketToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                 <p>Belum ada jadwal piket untuk hari {format(new Date(), 'EEEE', { locale: id })}.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-48 pr-2">
                {piketToday.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-850">
                    <div>
                      <h4 className="font-bold text-sm dark:text-white">{item.nama}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Jam: {item.jam} — Tugas: {item.tugas}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-medium rounded-full">
                      Piket Aktif
                    </span>
                  </div>
                ))}
              </div>
            )}
         </div>

         {/* Active Prokers Card */}
         <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
              <Target className="text-purple-500" size={20} /> Proker Aktif (Berjalan)
            </h3>
            {loading ? (
              <div className="flex justify-center items-center h-48 text-gray-500">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : prokersActive.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                 <p>Tidak ada program kerja yang sedang berjalan saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-48 pr-2">
                {prokersActive.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleShowProkerDetail(item)}
                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-850 hover:border-purple-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                  >
                    <div>
                      <h4 className="font-bold text-sm dark:text-white">{item.nama}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Penanggung Jawab: {item.pj}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-400 font-medium rounded-full">
                      Berjalan
                    </span>
                  </div>
                ))}
              </div>
            )}
         </div>
      </div>

    </div>
  );
}
