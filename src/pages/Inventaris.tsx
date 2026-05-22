import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Edit, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/src/lib/store';
import { 
  clientGetInventaris, 
  clientAddInventaris, 
  clientDeleteInventaris, 
  clientUpdateInventaris,
  clientGetCategories,
  CategoryItem
} from '../lib/firebaseClient';

interface Item {
  id: number;
  nama: string;
  kategori: string;
  kondisi: string;
  status: string;
}

export default function Inventaris() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  const fetchItemsAndCategories = async () => {
    try {
      setLoading(true);
      const [inventarisData, categoriesData] = await Promise.all([
        clientGetInventaris(),
        clientGetCategories()
      ]);
      setItems(inventarisData);
      setCategories(categoriesData);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemsAndCategories();
  }, []);

  const handleDelete = (id: number) => {
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat menghapus inventaris!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Hapus Barang?',
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
        await clientDeleteInventaris(id);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Data berhasil dihapus.',
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#3b82f6'
        });
        fetchItemsAndCategories();
      }
    });
  };

  const handleEdit = (item: Item) => {
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat mengubah inventaris!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const catOptions = categories.length > 0 
      ? categories.map(cat => `<option value="${cat.nama}" ${item.kategori === cat.nama ? 'selected' : ''}>${cat.nama}</option>`).join('')
      : `
        <option value="Elektronik" ${item.kategori === 'Elektronik' ? 'selected' : ''}>Elektronik</option>
        <option value="ATK" ${item.kategori === 'ATK' ? 'selected' : ''}>ATK</option>
        <option value="Furnitur" ${item.kategori === 'Furnitur' ? 'selected' : ''}>Furnitur</option>
      `;

    Swal.fire({
        title: 'Edit Inventaris',
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nama Barang</label>
              <input id="swal-nama" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Nama Barang" value="${item.nama}">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Kategori</label>
              <select id="swal-kategori" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  ${catOptions}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Kondisi Barang</label>
              <select id="swal-kondisi" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  <option value="Baik" ${item.kondisi === 'Baik' ? 'selected' : ''}>Baik</option>
                  <option value="Rusak Ringan" ${item.kondisi === 'Rusak Ringan' ? 'selected' : ''}>Rusak Ringan</option>
                  <option value="Rusak Berat" ${item.kondisi === 'Rusak Berat' ? 'selected' : ''}>Rusak Berat</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Status Ketersediaan</label>
              <select id="swal-status" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  <option value="Tersedia" ${item.status === 'Tersedia' ? 'selected' : ''}>Tersedia</option>
                  <option value="Dipinjam" ${item.status === 'Dipinjam' ? 'selected' : ''}>Dipinjam</option>
              </select>
            </div>
          </div>
        `,
        focusConfirm: false,
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
        showCancelButton: true,
        cancelButtonText: 'Batal',
        confirmButtonText: 'Simpan',
        preConfirm: () => {
          const nama = (document.getElementById('swal-nama') as HTMLInputElement).value.trim();
          const kategori = (document.getElementById('swal-kategori') as HTMLSelectElement).value;
          const kondisi = (document.getElementById('swal-kondisi') as HTMLSelectElement).value;
          const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

          if (!nama) {
            Swal.showValidationMessage('Nama barang wajib diisi');
            return false;
          }
          return { nama, kategori, kondisi, status };
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            try {
                await clientUpdateInventaris(item.id, result.value);
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Data inventaris berhasil diperbarui.',
                    confirmButtonColor: '#3b82f6',
                    background: '#111827',
                    color: '#fff'
                });
                fetchItemsAndCategories();
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: err.message || 'Gagal menyimpan perubahan',
                    background: '#111827',
                    color: '#fff',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
  };

  const handleAdd = () => {
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat menambahkan inventaris!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const catOptions = categories.length > 0 
      ? categories.map(cat => `<option value="${cat.nama}">${cat.nama}</option>`).join('')
      : `
        <option value="Elektronik">Elektronik</option>
        <option value="ATK">ATK</option>
        <option value="Furnitur">Furnitur</option>
      `;

    Swal.fire({
        title: 'Tambah Inventaris',
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nama Barang</label>
              <input id="swal-nama" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Nama Barang">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Kategori</label>
              <select id="swal-kategori" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  ${catOptions}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Kondisi Barang</label>
              <select id="swal-kondisi" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Status Ketersediaan</label>
              <select id="swal-status" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  <option value="Tersedia">Tersedia</option>
                  <option value="Dipinjam">Dipinjam</option>
              </select>
            </div>
          </div>
        `,
        focusConfirm: false,
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6',
        showCancelButton: true,
        cancelButtonText: 'Batal',
        confirmButtonText: 'Simpan',
        preConfirm: () => {
          const nama = (document.getElementById('swal-nama') as HTMLInputElement).value.trim();
          const kategori = (document.getElementById('swal-kategori') as HTMLSelectElement).value;
          const kondisi = (document.getElementById('swal-kondisi') as HTMLSelectElement).value;
          const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

          if (!nama) {
            Swal.showValidationMessage('Nama barang wajib diisi');
            return false;
          }
          return { nama, kategori, kondisi, status };
        }
    }).then(async (result) => {
        if (result.isConfirmed && result.value) {
            try {
                await clientAddInventaris(result.value as any);
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: 'Data inventaris baru berhasil disimpan.',
                    confirmButtonColor: '#3b82f6',
                    background: '#111827',
                    color: '#fff'
                });
                fetchItemsAndCategories();
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: err.message || 'Gagal menyimpan data',
                    background: '#111827',
                    color: '#fff',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
  };

  const filteredItems = items.filter(i => i.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <PackageSearch className="text-blue-500 animate-pulse" /> Manajemen Inventaris
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data barang sekretariat OSIM</p>
        </div>
        
        {user?.role === 'admin' && (
          <button onClick={handleAdd} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30">
             <Plus size={20} /> Tambah Barang
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
                    placeholder="Cari barang..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white placeholder-gray-500"
                />
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Total: {filteredItems.length} Barang
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 font-semibold">
                    <tr>
                        <th className="px-6 py-4">NAMA BARANG</th>
                        <th className="px-6 py-4">KATEGORI</th>
                        <th className="px-6 py-4">KONDISI</th>
                        <th className="px-6 py-4">STATUS</th>
                        {user?.role === 'admin' && <th className="px-6 py-4 text-center">AKSI</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                    {loading ? (
                        <tr>
                          <td colSpan={user?.role === 'admin' ? 5 : 4} className="p-12 text-center text-gray-500">
                            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p>Membuat data barang...</p>
                          </td>
                        </tr>
                    ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={user?.role === 'admin' ? 5 : 4} className="p-12 text-center text-gray-500">
                            Tidak ada data inventaris ditemukan.
                          </td>
                        </tr>
                    ) : filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="px-6 py-4 font-semibold dark:text-white">{item.nama}</td>
                            <td className="px-6 py-4 dark:text-gray-300">
                                <span className="px-3.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs">{item.kategori}</span>
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
                            <td className="px-6 py-4">
                                <span className={`px-3.5 py-1.5 rounded-xl text-xs border ${
                                    item.status === 'Tersedia' 
                                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                      : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            {user?.role === 'admin' && (
                              <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center items-center gap-1">
                                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Edit Barang"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Hapus Barang"><Trash2 size={16} /></button>
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
