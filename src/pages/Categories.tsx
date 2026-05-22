import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit2, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/src/lib/store';
import { 
  clientGetCategories, 
  clientAddCategory, 
  clientDeleteCategory, 
  clientUpdateCategory,
  CategoryItem
} from '../lib/firebaseClient';

export default function Categories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await clientGetCategories();
      setCategories(data);
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat menambahkan kategori!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Tambah Kategori Baru',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Nama Kategori</label>
            <input id="swal-kategori-name" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: Media, Konsumsi, Logistik">
          </div>
        </div>
      `,
      focusConfirm: false,
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#9333ea',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        const nameInputValue = (document.getElementById('swal-kategori-name') as HTMLInputElement).value.trim();
        if (!nameInputValue) {
          Swal.showValidationMessage('Nama kategori wajib diisi');
          return false;
        }
        return { nama: nameInputValue };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientAddCategory(result.value);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Kategori baru berhasil ditambahkan.',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#9333ea'
          });
          fetchCategories();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal menyimpan kategori',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const handleEdit = (category: CategoryItem) => {
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat mengubah kategori!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Edit Kategori',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Nama Kategori</label>
            <input id="swal-kategori-name" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Nama Kategori" value="${category.nama}">
          </div>
        </div>
      `,
      focusConfirm: false,
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#9333ea',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      preConfirm: () => {
        const nameInputValue = (document.getElementById('swal-kategori-name') as HTMLInputElement).value.trim();
        if (!nameInputValue) {
          Swal.showValidationMessage('Nama kategori wajib diisi');
          return false;
        }
        return { nama: nameInputValue };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientUpdateCategory(category.id, result.value);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Nama kategori berhasil diubah.',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#9333ea'
          });
          fetchCategories();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal mengubah kategori',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const handleDelete = (id: number) => {
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat menghapus kategori!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Hapus Kategori?',
      text: "Data tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: '#111827',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await clientDeleteCategory(id);
          Swal.fire({
            icon: 'success',
            title: 'Terhapus!',
            text: 'Kategori berhasil dihapus.',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#3b82f6'
          });
          fetchCategories();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal menghapus kategori',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const filteredCategories = categories.filter(c => c.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Tags className="text-purple-500" /> Kelola Kategori Inventaris
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Mengatur daftar kategori barang untuk Manajemen Inventaris</p>
        </div>
        
        {user?.role === 'admin' && (
          <button onClick={handleAdd} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/30">
             <Plus size={20} /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                </div>
                <input 
                    type="text" 
                    placeholder="Cari kategori..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white placeholder-gray-500"
                />
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Total: {filteredCategories.length} Kategori
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 font-semibold">
                    <tr>
                        <th className="px-6 py-4">ID KATEGORI</th>
                        <th className="px-6 py-4">NAMA KATEGORI</th>
                        {user?.role === 'admin' && <th className="px-6 py-4 text-center">AKSI MANAJEMEN</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                    {loading ? (
                        <tr>
                          <td colSpan={user?.role === 'admin' ? 3 : 2} className="p-12 text-center text-gray-500">
                            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p>Loading data kategori...</p>
                          </td>
                        </tr>
                    ) : filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan={user?.role === 'admin' ? 3 : 2} className="p-12 text-center text-gray-500">
                            Tidak ada kategori ditemukan.
                          </td>
                        </tr>
                    ) : filteredCategories.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">{item.id}</td>
                            <td className="px-6 py-4 font-semibold dark:text-white">
                              <span className="px-3.5 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs">{item.nama}</span>
                            </td>
                            {user?.role === 'admin' && (
                              <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center items-center gap-1">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-all" title="Edit Kategori"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Hapus Kategori"><Trash2 size={16} /></button>
                                  </div>
                              </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
