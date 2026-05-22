import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/lib/store';
import { Users, Package, CalendarDays, Target, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Total Inventaris', value: '45', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Proker Berjalan', value: '3', icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Petugas Piket', value: '12', icon: CalendarDays, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'User Aktif', value: '5', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

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
                <h3 className="text-3xl font-bold dark:text-white text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid Layout for Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
              <CalendarDays className="text-blue-500" size={20} /> Jadwal Piket Hari Ini
            </h3>
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
               <p>Belum ada jadwal piket hari ini.</p>
            </div>
         </div>
         <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
              <Target className="text-purple-500" size={20} /> Proker Aktif
            </h3>
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
               <p>Tidak ada program kerja yang sedang berjalan.</p>
            </div>
         </div>
      </div>

    </div>
  );
}
