import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/src/lib/store';
import { clientGetProker, clientAddProker, clientDeleteProker } from '../lib/firebaseClient';

interface ProkerData {
  id: number;
  nama: string;
  pj: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  deskripsi: string;
  status: string;
}

export default function Proker() {
  const [items, setItems] = useState<ProkerData[]>([]);
  const { user } = useAuthStore();

  const fetchItems = async () => {
      try {
          const data = await clientGetProker();
          setItems(data);
      } catch (e) {
          console.error(e);
          setItems([]);
      }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
       try {
         await clientAddProker({
             nama: 'LDKS OSIM 2024',
             pj: 'Gian Aditya',
             tanggal_mulai: '2024-07-10',
             tanggal_selesai: '2024-07-12',
             deskripsi: 'Latihan Dasar Kepemimpinan',
             status: 'Berjalan'
         });
         fetchItems();
       } catch (err) {
         console.error(err);
       }
  }

  const getStatusColor = (status: string) => {
      if (status === 'Selesai') return 'bg-emerald-500 text-white';
      if (status === 'Berjalan') return 'bg-blue-500 text-white';
      return 'bg-gray-500 text-white';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Target className="text-purple-500" /> Program Kerja
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Timeline dan realisasi program kerja OSIM</p>
        </div>
        {user?.role === 'admin' && (
            <button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/30">
               <Plus size={20} /> Tambah Proker
            </button>
        )}
      </div>

      <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 space-y-8 pb-12 mt-8">
         {items.map((item, idx) => (
             <div key={item.id} className="relative pl-8">
                 <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-4 border-white dark:border-gray-950 ${getStatusColor(item.status)}`}></div>
                 <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                     <div className="flex justify-between items-start mb-4">
                         <div>
                             <h3 className="text-xl font-bold dark:text-white">{item.nama}</h3>
                             <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">PJ: {item.pj}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)} bg-opacity-20`}>{item.status}</span>
                     </div>
                     <p className="dark:text-gray-300 mb-4">{item.deskripsi}</p>
                     <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl w-fit">
                         <span>📅 {item.tanggal_mulai}</span>
                         <span>→</span>
                         <span>📅 {item.tanggal_selesai}</span>
                     </div>
                     {user?.role === 'admin' && (
                         <div className="mt-4 flex gap-2">
                             <button onClick={async () => {
                                 await clientDeleteProker(item.id);
                                 fetchItems();
                             }} className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center gap-1">
                                 <Trash2 size={16} /> Hapus
                             </button>
                         </div>
                     )}
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
}
