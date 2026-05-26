import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Calendar, User, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
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

  const handleShowDetail = (item: ProkerData) => {
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
              <span class="text-xs font-bold ${
                item.status === 'Selesai' ? 'text-emerald-400' : item.status === 'Berjalan' ? 'text-blue-400' : 'text-gray-400'
              }">⏳ ${item.status}</span>
            </div>
          </div>
        </div>
      `,
      
      
      confirmButtonColor: '#9333ea',
      confirmButtonText: 'Tutup Detail',
    });
  };

  const handleAdd = async () => {
    Swal.fire({
      title: 'Tambah Program Kerja Baru',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Nama Program Kerja</label>
            <input id="swal-nama" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: LDKS OSIM 2024">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Penanggung Jawab (PJ)</label>
            <input id="swal-pj" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: Gian Aditya">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Tanggal Mulai</label>
              <input id="swal-mulai" type="date" value="${new Date().toISOString().split('T')[0]}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Tanggal Selesai</label>
              <input id="swal-selesai" type="date" value="${new Date().toISOString().split('T')[0]}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Deskripsi / Penjelasan Singkat</label>
            <textarea id="swal-deskripsi" rows="3" class="w-full bg-gray-900 border border-gray-700 text-white rounded-xl p-3 outline-none focus:border-purple-500 text-sm" placeholder="Sebutkan target, tujuan, dan rincian program kerja..."></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Status Proker</label>
            <select id="swal-status" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
              <option value="Berjalan">Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Belum Mulai">Belum Mulai</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      
      
      confirmButtonColor: '#9333ea',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        const nama = (document.getElementById('swal-nama') as HTMLInputElement).value.trim();
        const pj = (document.getElementById('swal-pj') as HTMLInputElement).value.trim();
        const tanggal_mulai = (document.getElementById('swal-mulai') as HTMLInputElement).value;
        const tanggal_selesai = (document.getElementById('swal-selesai') as HTMLInputElement).value;
        const deskripsi = (document.getElementById('swal-deskripsi') as HTMLTextAreaElement).value.trim();
        const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

        if (!nama || !pj) {
          Swal.showValidationMessage('Nama proker and PJ wajib diisi');
          return false;
        }
        return { nama, pj, tanggal_mulai, tanggal_selesai, deskripsi, status };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientAddProker(result.value);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Program Kerja baru telah ditambahkan.',
            
            
            confirmButtonColor: '#9333ea'
          });
          fetchItems();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal menyimpan data',
            
            
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

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
            <button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/30">
               <Plus size={20} /> Tambah Proker
            </button>
        )}
      </div>

      <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 space-y-8 pb-12 mt-8">
         {items.map((item, idx) => (
             <div key={item.id} className="relative pl-8">
                 <div className={`absolute -left-[9px] top-7 w-4 h-4 rounded-full border-4 border-white dark:border-gray-950 ${getStatusColor(item.status)}`}></div>
                 
                 <div 
                   onClick={() => handleShowDetail(item)}
                   className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:border-purple-500/40 cursor-pointer transition-all duration-300 group relative"
                 >
                     <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="text-xl font-bold dark:text-white group-hover:text-purple-400 transition-colors">{item.nama}</h3>
                              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm flex items-center gap-1.5 mt-1">
                                <User size={14} className="text-purple-400" /> PJ: {item.pj}
                              </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)} bg-opacity-20`}>{item.status}</span>
                     </div>
                     
                     <p className="dark:text-gray-350 text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{item.deskripsi || 'Ketuk untuk membaca penjelasan lengkap.'}</p>
                     
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 p-3 rounded-xl w-fit border border-gray-100 dark:border-gray-800/60 font-mono">
                            <span className="flex items-center gap-1">📅 {item.tanggal_mulai}</span>
                            <span className="text-gray-400 text-[10px]">sampai</span>
                            <span className="flex items-center gap-1">📅 {item.tanggal_selesai}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleShowDetail(item);
                             }}
                             className="text-purple-500 hover:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                           >
                             <Eye size={14} /> Detail
                           </button>
                           
                           {user?.role === 'admin' && (
                              <button 
                                onClick={async (e) => {
                                   e.stopPropagation();
                                   Swal.fire({
                                      title: 'Hapus Proker?',
                                      text: "Data proker ini akan dihapus permanen!",
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ef4444',
                                      cancelButtonColor: '#3085d6',
                                      confirmButtonText: 'Ya, hapus!',
                                      cancelButtonText: 'Batal',
                                      
                                      
                                   }).then(async (result) => {
                                      if (result.isConfirmed) {
                                          await clientDeleteProker(item.id);
                                          fetchItems();
                                          Swal.fire({
                                             title: 'Dihapus!',
                                             text: 'Program Kerja berhasil dihapus.',
                                             icon: 'success',
                                             
                                             
                                             confirmButtonColor: '#9333ea'
                                          });
                                      }
                                   });
                                }} 
                                className="text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                              >
                                  <Trash2 size={14} /> Hapus
                              </button>
                           )}
                        </div>
                     </div>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
}
