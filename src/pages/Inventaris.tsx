import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Edit, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { safeFetchJson } from '@/src/lib/utils';

interface Item {
  id: number;
  nama: string;
  kategori: string;
  kondisi: string;
  status: string;
}

export default function Inventaris() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventaris');
      const data = await safeFetchJson(res, []);
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

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Hapus Barang?',
      text: "Data tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetch(`/api/inventaris/${id}`, { method: 'DELETE' });
        Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
        fetchItems();
      }
    });
  };

  const handleAdd = () => {
      Swal.fire({
          title: 'Tambah Inventaris',
          html: `
            <input id="nama" class="swal2-input bg-gray-800 text-white border-gray-700" placeholder="Nama Barang">
            <select id="kategori" class="swal2-select bg-gray-800 text-white border-gray-700">
                <option value="Elektronik">Elektronik</option>
                <option value="ATK">ATK</option>
                <option value="Furnitur">Furnitur</option>
            </select>
             <select id="kondisi" class="swal2-select bg-gray-800 text-white border-gray-700">
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
            </select>
             <select id="status" class="swal2-select bg-gray-800 text-white border-gray-700">
                <option value="Tersedia">Tersedia</option>
                <option value="Dipinjam">Dipinjam</option>
            </select>
          `,
          focusConfirm: false,
          preConfirm: () => {
            const nama = (document.getElementById('nama') as HTMLInputElement).value;
            const kategori = (document.getElementById('kategori') as HTMLSelectElement).value;
            const kondisi = (document.getElementById('kondisi') as HTMLSelectElement).value;
            const status = (document.getElementById('status') as HTMLSelectElement).value;
            return { nama, kategori, kondisi, status };
          }
      }).then(async (result) => {
          if (result.isConfirmed) {
              await fetch('/api/inventaris', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(result.value)
              });
              Swal.fire('Berhasil!', 'Data tersimpan.', 'success');
              fetchItems();
          }
      })
  }

  const filteredItems = items.filter(i => i.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <PackageSearch className="text-blue-500" /> Manajemen Inventaris
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data barang sekretariat OSIM</p>
        </div>
        
        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30">
           <Plus size={20} /> Tambah Barang
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
         <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                </div>
                <input 
                    type="text" 
                    placeholder="Cari barang..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
                />
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
                    <tr>
                        <th className="px-6 py-4 font-medium">BARRANG</th>
                        <th className="px-6 py-4 font-medium">KATEGORI</th>
                        <th className="px-6 py-4 font-medium">KONDISI</th>
                        <th className="px-6 py-4 font-medium">STATUS</th>
                        <th className="px-6 py-4 font-medium text-right">AKSI</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loading ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                    ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                    ) : filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 font-medium dark:text-white">{item.nama}</td>
                            <td className="px-6 py-4 dark:text-gray-300">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">{item.kategori}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    item.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                }`}>
                                    {item.kondisi}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    item.status === 'Tersedia' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                    'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
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
