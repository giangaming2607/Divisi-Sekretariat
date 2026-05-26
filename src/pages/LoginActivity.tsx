import React, { useEffect, useState } from 'react';
import { clientGetLoginActivities, LoginActivity } from '../lib/firebaseClient';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Activity, MapPin, MonitorSmartphone, Clock } from 'lucide-react';

export default function LoginActivities() {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const data = await clientGetLoginActivities();
      setActivities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (lat: number, lng: number) => {
     window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="text-blue-500" /> Aktivitas Login
          </h2>
          <p className="text-gray-400 mt-1">Pantau lokasi dan waktu akses aplikasi, baik user maupun viewer.</p>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 overflow-hidden">
        {loading ? (
           <div className="flex justify-center items-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
           </div>
        ) : activities.length === 0 ? (
           <div className="text-center py-12 text-gray-500">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada aktivitas login yang tercatat.</p>
           </div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="text-gray-400 font-semibold border-b border-gray-800">
                 <tr>
                   <th className="pb-3 px-4">Pengguna</th>
                   <th className="pb-3 px-4">Peran</th>
                   <th className="pb-3 px-4">Waktu (Lokal)</th>
                   <th className="pb-3 px-4">Browser/Perangkat</th>
                   <th className="pb-3 px-4 text-right">Lokasi Maps</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800">
                 {activities.map((act) => (
                   <tr key={act.id} className="hover:bg-gray-800/40 transition-colors">
                     <td className="py-4 px-4 font-medium text-white">
                        {act.username}
                     </td>
                     <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${act.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {act.role.toUpperCase()}
                        </span>
                     </td>
                     <td className="py-4 px-4 text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-500"/> 
                          {format(new Date(act.waktu), 'dd MMM yyyy, HH:mm', { locale: id })}
                        </div>
                     </td>
                     <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap text-gray-400" title={act.userAgent}>
                          <MonitorSmartphone size={14} /> 
                          {act.userAgent?.split(' ')[0] || 'Unknown'}
                        </div>
                     </td>
                     <td className="py-4 px-4 text-right">
                        {act.latitude && act.longitude ? (
                           <button 
                             onClick={() => openMap(act.latitude as number, act.longitude as number)}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-colors font-medium text-xs"
                           >
                              <MapPin size={14} /> Lihat Lokasi
                           </button>
                        ) : (
                           <span className="text-gray-600 text-xs italic">Lokasi Tidak Diizinkan</span>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
}
