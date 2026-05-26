import React, { useState, useEffect, useRef } from 'react';
import { PackageSearch, Plus, Edit, Trash2, Search, FileSpreadsheet, Printer, Download, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
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
  jumlah: number;
  lokasi?: string;
}

export default function Inventaris() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

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
              <label class="block text-xs font-semibold text-gray-400 mb-1">Jumlah / Stok</label>
              <div class="flex gap-2">
                <input id="swal-jumlah" type="number" min="1" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl flex-1" placeholder="Contoh: 10" value="${item.jumlah || 1}">
                <select id="swal-satuan" class="swal2-select !m-0 !w-32 bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  <option value="Pcs" ${item.satuan === 'Pcs' ? 'selected' : ''}>Pcs</option>
                  <option value="Pack" ${item.satuan === 'Pack' ? 'selected' : ''}>Pack</option>
                </select>
              </div>
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
              <label class="block text-xs font-semibold text-gray-400 mb-1">Lokasi Barang</label>
              <input id="swal-lokasi" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: Lemari A, Gudang B" value="${item.lokasi || ''}">
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
          const jumlahVal = (document.getElementById('swal-jumlah') as HTMLInputElement).value;
          const satuan = (document.getElementById('swal-satuan') as HTMLSelectElement).value;
          const kategori = (document.getElementById('swal-kategori') as HTMLSelectElement).value;
          const kondisi = (document.getElementById('swal-kondisi') as HTMLSelectElement).value;
          const lokasi = (document.getElementById('swal-lokasi') as HTMLInputElement).value.trim();
          const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

          const jumlah = Number(jumlahVal) || 1;

          if (!nama) {
            Swal.showValidationMessage('Nama barang wajib diisi');
            return false;
          }
          if (jumlah < 1) {
            Swal.showValidationMessage('Jumlah barang minimal 1');
            return false;
          }
          return { nama, jumlah, satuan, kategori, kondisi, lokasi, status };
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
              <label class="block text-xs font-semibold text-gray-400 mb-1">Jumlah / Stok</label>
              <div class="flex gap-2">
                <input id="swal-jumlah" type="number" min="1" value="1" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl flex-1" placeholder="Contoh: 1">
                <select id="swal-satuan" class="swal2-select !m-0 !w-32 bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                  <option value="Pcs">Pcs</option>
                  <option value="Pack">Pack</option>
                </select>
              </div>
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
              <label class="block text-xs font-semibold text-gray-400 mb-1">Lokasi Barang</label>
              <input id="swal-lokasi" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: Lemari A, Gudang B">
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
          const jumlahVal = (document.getElementById('swal-jumlah') as HTMLInputElement).value;
          const satuan = (document.getElementById('swal-satuan') as HTMLSelectElement).value;
          const kategori = (document.getElementById('swal-kategori') as HTMLSelectElement).value;
          const kondisi = (document.getElementById('swal-kondisi') as HTMLSelectElement).value;
          const lokasi = (document.getElementById('swal-lokasi') as HTMLInputElement).value.trim();
          const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

          const jumlah = Number(jumlahVal) || 1;

          if (!nama) {
            Swal.showValidationMessage('Nama barang wajib diisi');
            return false;
          }
          if (jumlah < 1) {
            Swal.showValidationMessage('Jumlah barang minimal 1');
            return false;
          }
          return { nama, jumlah, satuan, kategori, kondisi, lokasi, status };
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

  const handlePrintPDF = () => {
    if (filteredItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Kosong',
        text: 'Tidak ada data inventaris untuk dicetak!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Pop-Up Terblokir',
        text: 'Harap izinkan pop-up di browser Anda untuk mencetak laporan.',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Inventaris OSIM</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1f2937;
              padding: 40px;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #1f2937;
              padding-bottom: 15px;
              margin-bottom: 35px;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #111827;
            }
            .header h2 {
              margin: 5px 0 0 0;
              font-size: 14px;
              font-weight: 500;
              color: #4b5563;
              text-transform: uppercase;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #4b5563;
              margin-bottom: 25px;
              font-weight: 500;
              border-bottom: 1px dashed #e5e7eb;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: #111827;
              color: #ffffff;
              border: 1px solid #111827;
              padding: 14px 16px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              text-align: left;
            }
            td {
              border: 1px solid #d1d5db;
              padding: 14px 16px;
              font-size: 13px;
              color: #1f2937;
              line-height: 1.5;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 6px;
              text-transform: uppercase;
            }
            .badge-baik { background-color: #e6f4ea; color: #137333; border: 1px solid #ceead6; }
            .badge-rusak-ringan { background-color: #fef7e0; color: #b06000; border: 1px solid #feebc8; }
            .badge-rusak-berat { background-color: #fce8e6; color: #c5221f; border: 1px solid #fad2cf; }
            .badge-tersedia { background-color: #e8f0fe; color: #1a73e8; border: 1px solid #d2e3fc; }
            .badge-dipinjam { background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
            .footer-signature {
              margin-top: 70px;
              display: flex;
              justify-content: flex-end;
            }
            .sig-box {
              text-align: center;
              font-size: 12px;
              width: 220px;
            }
            .sig-line {
              margin-top: 85px;
              border-top: 1px solid #1f2937;
              padding-top: 5px;
              font-weight: 700;
            }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN RESMI DATA INVENTARIS BARANG</h1>
            <h2>ORGANISASI SISWA INTRA SEKOLAH (OSIM)</h2>
          </div>
          <div class="meta-info">
            <div>Dibuat oleh: ${user?.username || 'Admin'}</div>
            <div>Tanggal Cetak: ${dateStr}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">NO</th>
                <th style="width: 25%">NAMA BARANG</th>
                <th style="width: 15%">KATEGORI</th>
                <th style="width: 10%; text-align: center;">JUMLAH</th>
                <th style="width: 13%">KONDISI</th>
                <th style="width: 17%">LOKASI</th>
                <th style="width: 15%">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map((item, index) => {
                const kondisiClass = item.kondisi === 'Baik' ? 'badge-baik' : item.kondisi === 'Rusak Ringan' ? 'badge-rusak-ringan' : 'badge-rusak-berat';
                const statusClass = item.status === 'Tersedia' ? 'badge-tersedia' : 'badge-dipinjam';
                return `
                  <tr>
                    <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                    <td style="font-weight: 700; padding-left: 18px;">${item.nama}</td>
                    <td style="color: #4b5563;">${item.kategori}</td>
                    <td style="text-align: center; font-weight: 700;">${item.jumlah || 1} ${item.satuan || 'Pcs'}</td>
                    <td><span class="badge ${kondisiClass}">${item.kondisi}</span></td>
                    <td style="color: #4b5563;">${item.lokasi || '-'}</td>
                    <td><span class="badge ${statusClass}">${item.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer-signature">
            <div class="sig-box">
              <p>Mengetahui,</p>
              <p style="margin-top: 5px; font-weight: 500;">Pengurus OSIM Harian</p>
              <div class="sig-line">${user?.username || 'Admin'}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Kosong',
        text: 'Tidak ada data inventaris untuk diexport!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Headers list
    const headers = ['No', 'Nama Barang', 'Kategori', 'Jumlah / Stok', 'Kondisi', 'Lokasi', 'Status'];
    
    // Rows mapping
    const csvRows = [
      'sep=,', // Inform Excel to use comma as field separator cleanly
      headers.join(','), // Header row
      ...filteredItems.map((item, index) => {
        const safeNama = `"${item.nama.replace(/"/g, '""')}"`;
        const safeKategori = `"${item.kategori.replace(/"/g, '""')}"`;
        const safeKondisi = `"${item.kondisi.replace(/"/g, '""')}"`;
        const safeLokasi = `"${(item.lokasi || '').replace(/"/g, '""')}"`;
        const safeStatus = `"${item.status.replace(/"/g, '""')}"`;
        return [
          index + 1,
          safeNama,
          safeKategori,
          `${item.jumlah || 1} ${item.satuan || 'Pcs'}`,
          safeKondisi,
          safeLokasi,
          safeStatus
        ].join(',');
      })
    ];

    // CSV containing Byte Order Mark for Excel so Unicode and separation works flawlessly
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventaris_OSIM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'File Excel (CSV) berhasil digenerate dan diunduh.',
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#10b981'
    });
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      'Nomor': 1,
      'Nama Barang': 'Contoh Barang',
      'Kondisi Barang': 'Baik',
      'Lokasi Barang': 'Lemari A'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Inventaris");
    XLSX.writeFile(wb, "template_inventaris.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat mengimport inventaris!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let successCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
          const nama = row['Nama Barang'];
          const kondisi = row['Kondisi Barang'];
          const lokasi = row['Lokasi Barang'];
          
          if (nama) {
            try {
              await clientAddInventaris({
                nama: String(nama).trim(),
                kondisi: (kondisi && ['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(kondisi)) ? kondisi : 'Baik',
                lokasi: lokasi ? String(lokasi).trim() : '',
                kategori: 'Lainnya',
                status: 'Tersedia',
                jumlah: 1,
                satuan: 'Pcs'
              });
              successCount++;
            } catch (err) {
              errorCount++;
            }
          }
        }
        
        fetchItemsAndCategories();
        
        Swal.fire({
          icon: 'success',
          title: 'Import Selesai',
          text: `Berhasil import ${successCount} data. ${errorCount > 0 ? `(${errorCount} gagal)` : ''}`,
          background: '#111827',
          color: '#fff'
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Import',
          text: 'Pastikan file Excel sesuai dengan template',
          background: '#111827',
          color: '#fff'
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // reset input
  };

  const filteredItems = items.filter(i => i.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <PackageSearch className="text-blue-500 animate-pulse" /> Manajemen Inventaris
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data barang sekretariat OSIM</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 font-medium text-sm">
             <FileSpreadsheet size={18} /> Export CSV
          </button>
          
          <button onClick={handleDownloadTemplate} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/30 font-medium text-sm">
             <Download size={18} /> Template Excel
          </button>
          
          {user?.role === 'admin' && (
            <>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImport} 
              />
              <button onClick={() => fileInputRef.current?.click()} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/30 font-medium text-sm">
                 <Upload size={18} /> Import Data
              </button>
            </>
          )}

          <button onClick={handlePrintPDF} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 font-medium text-sm">
             <Printer size={18} /> Cetak
          </button>
          {user?.role === 'admin' && (
            <button onClick={handleAdd} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 font-medium text-sm">
               <Plus size={18} /> Tambah
            </button>
          )}
        </div>
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
                        <th className="px-6 py-4">JUMLAH</th>
                        <th className="px-6 py-4">KONDISI</th>
                        <th className="px-6 py-4">LOKASI</th>
                        <th className="px-6 py-4">STATUS</th>
                        {user?.role === 'admin' && <th className="px-6 py-4 text-center">AKSI</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                    {loading ? (
                        <tr>
                          <td colSpan={user?.role === 'admin' ? 7 : 6} className="p-12 text-center text-gray-500">
                            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p>Membuat data barang...</p>
                          </td>
                        </tr>
                    ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={user?.role === 'admin' ? 7 : 6} className="p-12 text-center text-gray-500">
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
