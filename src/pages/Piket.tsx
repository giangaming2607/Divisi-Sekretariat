import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Bell } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/src/lib/store';
import { clientGetPiket, clientAddPiket, clientDeletePiket } from '../lib/firebaseClient';

interface PiketData {
  id: number;
  nama: string;
  hari: string;
  tanggal: string;
  jam: string;
  tugas: string;
  nomor_wa: string;
}

export default function Piket() {
  const [items, setItems] = useState<PiketData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchItems = async () => {
    try {
      const data = await clientGetPiket();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = () => {
       clientAddPiket({
           nama: 'Gian Aditya',
           hari: 'Senin',
           tanggal: '2023-10-31',
           jam: '07:00',
           tugas: 'Menyapu Ruangan',
           nomor_wa: '08123456789'
       }).then(() => fetchItems());
  }
  
  const handleDelete = async (id: number) => {
       await clientDeletePiket(id);
       fetchItems();
  }

  const sendReminder = async (item: PiketData) => {
      Swal.fire({
          title: 'Kirim Reminder WA?',
          text: `Akan mengirim pesan otomatis ke ${item.nama} (${item.nomor_wa})`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Kirim Pesan'
      }).then(async (result) => {
          if (result.isConfirmed) {
              const messageBody = `Halo ${item.nama}, hari ini jadwal piket Anda hari ${item.hari}, tanggal ${item.tanggal} jam ${item.jam}. Tugas Anda: ${item.tugas}.`;
              try {
                  const res = await fetch('/api/wa/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          phone: item.nomor_wa,
                          message: messageBody
                      })
                  });
                  if (res.ok) {
                      Swal.fire('Terkirim', 'Pesan berhasil dikirim via WhatsApp bot!', 'success');
                      return;
                  }
              } catch (e) {
                  console.log('Automated bot unreachable, using fallback URL redirect', e);
              }

              // Client fallback: wa.me redirect
              const cleanNumber = item.nomor_wa.replace(/^0+/, '62').replace(/\D/g, '');
              const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageBody)}`;
              window.open(waUrl, '_blank');
              Swal.fire({
                title: 'Reminder Dialihkan',
                text: 'WhatsApp bot tidak aktif. Mengalihkan ke WhatsApp Web/App Anda secara langsung.',
                icon: 'info',
                confirmButtonColor: '#3b82f6'
              });
          }
      });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <CalendarDays className="text-emerald-500" /> Jadwal Piket
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sistem penjadwalan dan reminder otomatis</p>
        </div>
        {user?.role === 'admin' && (
            <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30">
               <Plus size={20} /> Tambah Jadwal
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(piket => (
              <div key={piket.id} className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl -mr-10 -mt-10"></div>
                 <div className="flex justify-between items-start mb-4 relative z-10">
                     <div>
                         <h3 className="text-xl font-bold dark:text-white">{piket.nama}</h3>
                         <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{piket.hari}, {piket.tanggal}</p>
                     </div>
                     <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-mono dark:text-gray-300">{piket.jam}</span>
                 </div>
                 <div className="space-y-4 relative z-10">
                     <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                         <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Tugas:</p>
                         <p className="dark:text-white">{piket.tugas}</p>
                     </div>
                     {user?.role === 'admin' && (
                         <div className="flex gap-2">
                            <button onClick={() => sendReminder(piket)} className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Bell size={16} /> Reminder
                            </button>
                            <button onClick={() => handleDelete(piket.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-3 rounded-xl transition-colors">
                                <Trash2 size={16} />
                            </button>
                         </div>
                     )}
                 </div>
              </div>
          ))}
          {items.length === 0 && !loading && (
             <div className="col-span-full p-12 text-center text-gray-500">Belum ada jadwal piket.</div>
          )}
      </div>
    </div>
  );
}
