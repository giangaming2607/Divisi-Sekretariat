import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Bell, CheckSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/src/lib/store';
import { 
  clientGetPiket, 
  clientAddPiket, 
  clientDeletePiket, 
  clientGetUsers 
} from '../lib/firebaseClient';
import { cn } from '../lib/utils';

interface PiketData {
  id: number;
  nama: string;
  hari: string;
  tanggal: string;
  jam: string;
  tugas: string;
  nomor_wa: string;
}

interface UserData {
  id: number;
  username: string;
  role: string;
  nomor_wa?: string;
}

export default function Piket() {
  const [items, setItems] = useState<PiketData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchItems = async () => {
    try {
      const [piketData, userData] = await Promise.all([
        clientGetPiket(),
        clientGetUsers()
      ]);
      setItems(piketData);
      setUsers(userData);
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
    if (user?.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Hanya Admin yang dapat menjadwalkan piket!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Tambah Jadwal Piket Mingguan',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Hari Piket</label>
            <select id="swal-hari" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Tanggal Roster (Opsional)</label>
            <input id="swal-tanggal" type="date" value="${new Date().toISOString().split('T')[0]}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Jam Mulai Piket</label>
            <input id="swal-jam" type="time" value="07:00" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Tugas / Tanggung Jawab</label>
            <input id="swal-tugas" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: Piket Sekretariat / Sapu & Merapikan Buku" value="Piket Sekretariat">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Pilih Anggota Piket (Dapat memilih lebih dari 1)</label>
            <div class="bg-gray-950 border border-gray-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800">
               ${users.map(u => `
                 <label class="flex items-center space-x-2.5 text-sm text-gray-300 hover:text-white cursor-pointer py-1 border-b border-gray-900 last:border-0">
                   <input type="checkbox" name="swal-member" value="${u.username}" data-phone="${u.nomor_wa || ''}" class="rounded border-gray-700 text-emerald-500 focus:ring-emerald-500 bg-gray-900">
                   <div class="flex flex-col">
                     <span class="font-medium">${u.username}</span>
                     ${u.nomor_wa ? `<span class="text-[10px] text-emerald-400">${u.nomor_wa}</span>` : '<span class="text-[10px] text-amber-500 italic">WhatsApp Belum Diatur</span>'}
                   </div>
                 </label>
               `).join('') || '<p class="text-gray-500 text-xs italic">Belum ada user terdaftar</p>'}
            </div>
          </div>
          <div class="pt-2 border-t border-gray-800">
            <span class="block text-xs font-semibold text-gray-400 mb-1">Atau Tambah Anggota Manual (Non-Akun)</span>
            <div class="grid grid-cols-2 gap-2">
              <input id="swal-nama-manual" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Nama Anggota">
              <input id="swal-wa-manual" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="No WA (misal: 0812...)">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Simpan Roster',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const hari = (document.getElementById('swal-hari') as HTMLSelectElement).value;
        const tanggal = (document.getElementById('swal-tanggal') as HTMLInputElement).value;
        const jam = (document.getElementById('swal-jam') as HTMLInputElement).value;
        const tugas = (document.getElementById('swal-tugas') as HTMLInputElement).value.trim();
        const namaManual = (document.getElementById('swal-nama-manual') as HTMLInputElement).value.trim();
        const waManual = (document.getElementById('swal-wa-manual') as HTMLInputElement).value.trim();

        const checkboxes = document.getElementsByName('swal-member') as NodeListOf<HTMLInputElement>;
        const selectedMembers: { nama: string; nomor_wa: string }[] = [];
        checkboxes.forEach(cb => {
          if (cb.checked) {
            selectedMembers.push({
              nama: cb.value,
              nomor_wa: cb.getAttribute('data-phone') || ''
            });
          }
        });

        if (namaManual) {
          selectedMembers.push({
            nama: namaManual,
            nomor_wa: waManual
          });
        }

        if (selectedMembers.length === 0) {
          Swal.showValidationMessage('Silakan centang minimal 1 anggota atau ketik manual');
          return false;
        }

        if (!hari || !tugas) {
          Swal.showValidationMessage('Hari dan Tugas harus diisi');
          return false;
        }

        return { hari, tanggal, jam, tugas, selectedMembers };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { hari, tanggal, jam, tugas, selectedMembers } = result.value;
        try {
          for (const member of selectedMembers) {
            await clientAddPiket({
              nama: member.nama,
              hari,
              tanggal,
              jam,
              tugas,
              nomor_wa: member.nomor_wa
            });
          }
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `Roster piket harian disimpan (${selectedMembers.length} anggota).`,
            confirmButtonColor: '#10b981',
            background: '#111827',
            color: '#fff'
          });
          fetchItems();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal menyimpan roster',
            confirmButtonColor: '#ef4444',
            background: '#111827',
            color: '#fff'
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
        text: 'Hanya Admin yang dapat menghapus roster!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Hapus Petugas?',
      text: "Petugas akan dihapus dari roster hari ini!",
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
        await clientDeletePiket(id);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Roster berhasil dihapus.',
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
        fetchItems();
      }
    });
  };

  const sendReminder = async (item: PiketData) => {
    if (!item.nomor_wa) {
      Swal.fire({
        icon: 'warning',
        title: 'Kontak Kosong',
        text: `Anggota ${item.nama} belum memiliki nomor WhatsApp terdaftar.`,
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    Swal.fire({
      title: 'Kirim Reminder WA?',
      text: `Akan mengirim pesan otomatis ke ${item.nama} (${item.nomor_wa})`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Kirim Pesan',
      cancelButtonText: 'Batal',
      background: '#111827',
      color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const messageBody = `Halo ${item.nama}, hari ini jadwal piket Anda hari ${item.hari}, tanggal ${item.tanggal || '-'} jam ${item.jam}. Tugas Anda: ${item.tugas}. Mohon kehadirannya tepat waktu.`;
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
            Swal.fire({
              icon: 'success',
              title: 'Terkirim',
              text: 'Pesan berhasil dikirim via WhatsApp API Bot!',
              confirmButtonColor: '#10b981',
              background: '#111827',
              color: '#fff'
            });
            return;
          }
        } catch (e) {
          console.log('Automated bot unreachable, using fallback URL redirect', e);
        }

        // Fallback: direct Click to Chat link
        const cleanNumber = item.nomor_wa.replace(/^0+/, '62').replace(/\D/g, '');
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageBody)}`;
        window.open(waUrl, '_blank');
        Swal.fire({
          title: 'Reminder Dialihkan',
          text: 'Mengalihkan ke WhatsApp Web atau aplikasi Anda secara langsung.',
          icon: 'info',
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  };

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const todayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <CalendarDays className="text-emerald-500" /> Jadwal Roster Piket Mingguan
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sistem penjadwalan teratur dan reminder WA otomatis</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={handleAdd} 
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} /> Tambah Jadwal Minggu ini
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-gray-800/80">
          <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-500 text-sm">Menyusun roster mingguan...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-start pb-10">
          {daysOfWeek.map(day => {
            const piketByDay = items.filter(
              p => p.hari && p.hari.trim().toLowerCase() === day.toLowerCase()
            );
            const isToday = todayName.toLowerCase() === day.toLowerCase();

            return (
              <div 
                key={day} 
                className={cn(
                  "rounded-2xl border p-4 transition-all duration-300 relative flex flex-col min-h-[350px]",
                  isToday 
                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20" 
                    : "bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700/80"
                )}
              >
                {/* Header day */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/60 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      isToday ? "bg-emerald-500 animate-ping" : "bg-gray-400 dark:bg-gray-700"
                    )}></span>
                    <span className="font-bold text-base dark:text-white">{day}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono font-bold rounded-full px-2 py-0.5",
                    piketByDay.length > 0 
                      ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  )}>
                    {piketByDay.length} Org
                  </span>
                </div>

                {/* Members of this day */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {piketByDay.map(piket => (
                    <div 
                      key={piket.id} 
                      className="p-3 bg-gray-50/75 dark:bg-gray-950/45 rounded-xl border border-gray-100 dark:border-gray-800/60 hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs dark:text-white tracking-tight truncate" title={piket.nama}>
                            {piket.nama}
                          </h4>
                          {piket.tanggal && (
                            <span className="text-[9px] text-gray-500 block">{piket.tanggal}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                          {piket.jam || '07:00'}
                        </span>
                      </div>

                      <div className="mt-2 bg-white dark:bg-gray-900/40 rounded-lg p-2 border border-gray-100 dark:border-gray-800 text-left">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-0.5">Tugas:</p>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed line-clamp-2">
                          {piket.tugas}
                        </p>
                      </div>

                      <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-850/60 justify-end">
                        <button 
                          onClick={() => sendReminder(piket)} 
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 rounded-lg transition-colors" 
                          title="Kirim Reminder WA"
                        >
                          <Bell size={12} />
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(piket.id)} 
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg transition-colors" 
                            title="Hapus Dari Roster"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {piketByDay.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
                      <CheckSquare size={20} className="stroke-[1.5] mb-1.5 opacity-40 text-gray-400" />
                      <p className="text-[11px] italic text-center">Roster Bersih</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
