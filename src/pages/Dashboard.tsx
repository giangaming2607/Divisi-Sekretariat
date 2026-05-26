import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/lib/store';
import { Users, Package, CalendarDays, Target, Activity, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { 
  clientGetInventaris, 
  clientGetProker, 
  clientGetPiket, 
  clientGetUsers,
  clientGetInformasi,
  InventarisItem,
  ProkerItem,
  PiketItem,
  InfoItem
} from '../lib/firebaseClient';

interface User {
  id: number;
  username: string;
  role: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [useJakartaTime, setUseJakartaTime] = useState(true);
  
  // Real Firestore States
  const [inventarisCount, setInventarisCount] = useState<number>(0);
  const [prokerActiveCount, setProkerActiveCount] = useState<number>(0);
  const [piketCount, setPiketCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  
  const [piketToday, setPiketToday] = useState<PiketItem[]>([]);
  const [prokersActive, setProkersActive] = useState<ProkerItem[]>([]);
  const [informasiTerbaru, setInformasiTerbaru] = useState<InfoItem[]>([]);
  const [inventarisTerbaru, setInventarisTerbaru] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const showFullInfo = (info: InfoItem) => {
    Swal.fire({
      title: info.judul,
      html: `<div class="text-left text-sm whitespace-pre-wrap mt-4 text-gray-800 dark:text-gray-200">${info.konten}</div>`,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: 'rounded-2xl',
      }
    });
  };

  useEffect(() => {
    const askAndRecordActivity = async () => {
      const sessionKey = `login_activity_recorded_${user ? user.username : 'viewer'}`;
      const sessionRecorded = sessionStorage.getItem(sessionKey);
      const hasAskedLocation = localStorage.getItem('has_asked_location_v2');

      const record = async (lat: number | null, lng: number | null) => {
        if (!sessionRecorded) {
          sessionStorage.setItem(sessionKey, 'true');
          try {
            // Import dynamically or ensure clientRecordLogin is available
            const { clientRecordLogin } = await import('../lib/firebaseClient');
            await clientRecordLogin({
              username: user ? user.username : 'Viewer',
              role: user ? user.role : 'viewer',
              waktu: new Date().toISOString(),
              latitude: lat,
              longitude: lng,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              userAgent: navigator.userAgent
            });
          } catch (e) {
            console.error('Failed to record activity', e);
          }
        }
      };

      if (!user && !hasAskedLocation) {
        const result = await Swal.fire({
          title: 'Izin Lokasi',
          text: 'Kami membutuhkan izin lokasi Anda untuk menyesuaikan jam dashboard. Jam akan menggunakan waktu Jakarta terlebih dahulu sebelum Anda memberikan izin.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Izinkan',
          cancelButtonText: 'Nanti',
          confirmButtonColor: '#3b82f6'
        });

        localStorage.setItem('has_asked_location_v2', 'true');

        if (result.isConfirmed) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUseJakartaTime(false);
              record(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              record(null, null);
            }
          );
          return;
        }
      }

      // If user is admin or we already asked
      if (navigator.permissions && navigator.permissions.query) {
         navigator.permissions.query({ name: 'geolocation' }).then(res => {
           if (res.state === 'granted') {
             setUseJakartaTime(false);
             navigator.geolocation.getCurrentPosition(
               (pos) => record(pos.coords.latitude, pos.coords.longitude),
               () => record(null, null)
             );
           } else {
             record(null, null);
           }
         }).catch(() => record(null, null));
      } else {
         record(null, null);
      }
    };

    askAndRecordActivity();
  }, [user]);

  const getDisplayTime = () => {
    if (!useJakartaTime) return currentTime;
    const utc = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 7)); // Jakarta is UTC+7
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [inventaris, prokers, pikets, users, infos] = await Promise.all([
          clientGetInventaris(),
          clientGetProker(),
          clientGetPiket(),
          clientGetUsers(),
          clientGetInformasi()
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

        // 4. Set informasi
        setInformasiTerbaru(infos.slice(0, 3));

        // 5. Set inventaris terbaru (top 5) for dashboard viewer 
        setInventarisTerbaru(inventaris.slice(0, 5));
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
      
      
      confirmButtonColor: '#9333ea',
      confirmButtonText: 'Tutup Detail',
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">
            {user ? `Selamat datang, ${user.username}! 👋` : 'Selamat datang di Sekretariat OSIM! 👋'}
          </h2>
          <p className="text-blue-100 max-w-xl">
            Sistem informasi manajemen Sekretariat OSIM. Kelola inventaris, program kerja, dan jadwal kegiatan dengan mudah.
          </p>
          <div className="mt-8 flex items-center space-x-2 bg-black/20 w-fit px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
             <Activity className="text-blue-300 animate-pulse" size={18} />
             <span className="font-mono">{format(getDisplayTime(), 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id })}</span>
          </div>
        </div>
        
        {/* Decor */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Info Terbaru Section */}
      {informasiTerbaru.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
            <Megaphone size={22} className="animate-pulse" />
            <h3 className="font-bold text-lg">Info Terbaru</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {informasiTerbaru.map((info) => (
              <div key={info.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{info.judul}</h4>
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {format(new Date(info.tanggal), 'dd MMM yyyy', { locale: id })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">{info.konten}</p>
                <button 
                  onClick={() => showFullInfo(info)}
                  className="mt-2 text-[11px] sm:text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors flex items-center gap-1"
                >
                  Lihat Selengkapnya &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <div key={item.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.nama}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Jam: {item.jam} — Tugas: {item.tugas}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium rounded-full">
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
                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.nama}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Penanggung Jawab: {item.pj}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium rounded-full">
                      Berjalan
                    </span>
                  </div>
                ))}
              </div>
            )}
         </div>
      </div>

      {/* Viewer: Inventaris Table on Dashboard */}
      <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mt-6">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
           <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
             <Package className="text-blue-500" size={20} /> Data Inventaris Terbaru
           </h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 font-semibold">
                  <tr>
                      <th className="px-6 py-4">NAMA BARANG</th>
                      <th className="px-6 py-4">KATEGORI</th>
                      <th className="px-6 py-4">JUMLAH</th>
                      <th className="px-6 py-4">KONDISI</th>
                      <th className="px-6 py-4">LOKASI</th>
                      <th className="px-6 py-4">STATUS</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                         Memuat...
                      </td>
                    </tr>
                  ) : inventarisTerbaru.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                         Belum ada barang
                      </td>
                    </tr>
                  ) : inventarisTerbaru.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold dark:text-white">{item.nama}</td>
                        <td className="px-6 py-4 dark:text-gray-300">
                            <span className="px-3.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs">{item.kategori}</span>
                        </td>
                        <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl font-mono text-xs">{item.jumlah || 1} {item.satuan || 'Pcs'}</span>
                        </td>
                        <td className="px-6 py-4">
                             <span className={`px-3.5 py-1.5 rounded-xl text-xs border ${
                                item.kondisi === 'Baik' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : item.kondisi === 'Rusak Ringan' 
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                {item.kondisi}
                            </span>
                        </td>
                        <td className="px-6 py-4 dark:text-gray-300">
                            {item.lokasi || '-'}
                        </td>
                        <td className="px-6 py-4">
                             <span className={`px-3.5 py-1.5 rounded-xl text-xs border ${
                                item.status === 'Tersedia' 
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                                {item.status}
                            </span>
                        </td>
                    </tr>
                  ))}
              </tbody>
           </table>
        </div>
      </div>

    </div>
  );
}
