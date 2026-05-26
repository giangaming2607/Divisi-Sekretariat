import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  clientGetInformasi, 
  clientAddInformasi, 
  clientDeleteInformasi, 
  clientUpdateInformasi,
  InfoItem 
} from '../lib/firebaseClient';

export default function InputInformasi() {
  const [items, setItems] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInformasi = async () => {
    try {
      setLoading(true);
      const data = await clientGetInformasi();
      setItems(data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Gagal memuat data informasi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInformasi();
  }, []);

  const handleAdd = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Info Terbaru',
      html: `
        <div class="text-left">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Informasi</label>
          <input id="swal-judul" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" placeholder="Masukkan judul..." />
          
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Konten / Isi Informasi</label>
          <textarea id="swal-konten" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-32 resize-none" placeholder="Masukkan konten informasi..."></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      
      
      preConfirm: () => {
        const judul = (document.getElementById('swal-judul') as HTMLInputElement).value;
        const konten = (document.getElementById('swal-konten') as HTMLTextAreaElement).value;
        if (!judul || !konten) {
          Swal.showValidationMessage('Judul dan konten harus diisi');
        }
        return { judul, konten };
      }
    });

    if (formValues) {
      try {
        await clientAddInformasi({
          judul: formValues.judul,
          konten: formValues.konten,
          tanggal: new Date().toISOString()
        });
        Swal.fire({ title: 'Berhasil', text: 'Informasi berhasil ditambahkan', icon: 'success',   });
        fetchInformasi();
      } catch (err) {
        Swal.fire('Error', 'Gagal menambahkan informasi', 'error');
      }
    }
  };

  const handleEdit = async (item: InfoItem) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Informasi',
      html: `
        <div class="text-left">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Informasi</label>
          <input id="swal-judul" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" value="${item.judul}" />
          
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Konten / Isi Informasi</label>
          <textarea id="swal-konten" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-32 resize-none">${item.konten}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      
      
      preConfirm: () => {
        const judul = (document.getElementById('swal-judul') as HTMLInputElement).value;
        const konten = (document.getElementById('swal-konten') as HTMLTextAreaElement).value;
        if (!judul || !konten) {
          Swal.showValidationMessage('Judul dan konten harus diisi');
        }
        return { judul, konten };
      }
    });

    if (formValues) {
      try {
        await clientUpdateInformasi(item.id, {
          judul: formValues.judul,
          konten: formValues.konten
        });
        Swal.fire({ title: 'Berhasil', text: 'Informasi berhasil diupdate', icon: 'success',   });
        fetchInformasi();
      } catch (err) {
        Swal.fire('Error', 'Gagal mengupdate informasi', 'error');
      }
    }
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Hapus Informasi?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, hapus!',
      
      
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await clientDeleteInformasi(id);
          Swal.fire({ title: 'Terhapus!', text: 'Informasi telah dihapus.', icon: 'success',   });
          fetchInformasi();
        } catch (err) {
          Swal.fire('Error', 'Gagal menghapus informasi', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
            <Megaphone size={26} className="text-amber-500" />
            Kelola Informasi
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Input info terbaru yang akan muncul di dashboard</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/30 font-medium whitespace-nowrap w-fit"
        >
          <Plus size={18} /> Tambah Informasi
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
           <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white/5 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center text-gray-500">
           <Megaphone size={40} className="mb-3 opacity-20" />
           <p>Belum ada informasi terbaru. Klik "Tambah Informasi" untuk mulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm group">
               <div className="flex justify-between items-start mb-3 gap-2">
                 <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{item.judul}</h3>
                 <div className="flex gap-1 shrink-0 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500/20"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"><Trash2 size={14} /></button>
                 </div>
               </div>
               <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md mb-3 inline-block">
                 {format(new Date(item.tanggal), 'dd MMMM yyyy, HH:mm', { locale: id })}
               </span>
               <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{item.konten}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
