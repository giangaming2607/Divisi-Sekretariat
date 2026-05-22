import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, UserX, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  clientGetUsers, 
  clientAddUser, 
  clientUpdateUser, 
  clientDeleteUser 
} from '../lib/firebaseClient';

interface User {
  id: number;
  username: string;
  role: string;
  nomor_wa?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await clientGetUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    Swal.fire({
      title: 'Tambah Pengguna Baru',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Username</label>
            <input id="swal-username" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Masukkan username">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Password</label>
            <div class="relative">
              <input id="swal-password" type="password" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pr-16" placeholder="Masukkan password">
              <button type="button" id="toggle-swal-password" class="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none">
                Lihat
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Nomor WhatsApp (Aktif Kirim Bot)</label>
            <input id="swal-nomor-wa" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: 08123456789">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Hak Akses / Role</label>
            <select id="swal-role" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
              <option value="user">Anggota Sekretariat</option>
              <option value="admin">Admin (Sekretaris / Pengurus)</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Simpan',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      didOpen: () => {
        const toggleBtn = document.getElementById('toggle-swal-password');
        const passwordInput = document.getElementById('swal-password') as HTMLInputElement;
        if (toggleBtn && passwordInput) {
          toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
              passwordInput.type = 'text';
              toggleBtn.textContent = 'Sembunyi';
            } else {
              passwordInput.type = 'password';
              toggleBtn.textContent = 'Lihat';
            }
          });
        }
      },
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value.trim();
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const nomor_wa = (document.getElementById('swal-nomor-wa') as HTMLInputElement).value.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement).value;

        if (!username || !password) {
          Swal.showValidationMessage('Username dan Password wajib diisi');
          return false;
        }
        return { username, password, role, nomor_wa };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientAddUser(result.value);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Pengguna baru berhasil ditambahkan!',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#3b82f6'
          });
          fetchUsers();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Terjadi kesalahan sistem',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const handleEditUser = (user: User) => {
    Swal.fire({
      title: 'Edit Pengguna',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Username</label>
            <input id="swal-username" value="${user.username}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Masukkan username">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Password Baru (Kosongkan jika tidak diganti)</label>
            <div class="relative">
              <input id="swal-password" type="password" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pr-16" placeholder="Ganti password (opsional)">
              <button type="button" id="toggle-swal-password" class="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none">
                Lihat
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Nomor WhatsApp (Aktif Kirim Bot)</label>
            <input id="swal-nomor-wa" value="${user.nomor_wa || ''}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="Contoh: 08123456789">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1">Hak Akses / Role</label>
            <select id="swal-role" class="swal2-select !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl pb-2">
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>Anggota Sekretariat</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin (Sekretaris / Pengurus)</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      background: '#111827',
      color: '#fff',
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Update',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      didOpen: () => {
        const toggleBtn = document.getElementById('toggle-swal-password');
        const passwordInput = document.getElementById('swal-password') as HTMLInputElement;
        if (toggleBtn && passwordInput) {
          toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
              passwordInput.type = 'text';
              toggleBtn.textContent = 'Sembunyi';
            } else {
              passwordInput.type = 'password';
              toggleBtn.textContent = 'Lihat';
            }
          });
        }
      },
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value.trim();
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const nomor_wa = (document.getElementById('swal-nomor-wa') as HTMLInputElement).value.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement).value;

        if (!username) {
          Swal.showValidationMessage('Username tidak boleh kosong');
          return false;
        }
        return { username, password: password || undefined, role, nomor_wa };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientUpdateUser(user.id, result.value);
          Swal.fire({
            icon: 'success',
            title: 'Diperbarui',
            text: 'Data pengguna berhasil diubah!',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#3b82f6'
          });
          fetchUsers();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Terjadi kesalahan sistem',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const handleDeleteUser = (user: User) => {
    if (user.username === 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Pembatasan',
        text: 'Akun admin utama tidak bisa dihapus!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    Swal.fire({
      title: 'Hapus Pengguna?',
      text: `Apakah Anda yakin ingin menghapus user "${user.username}"?`,
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
          await clientDeleteUser(user.id);
          Swal.fire({
            icon: 'success',
            title: 'Terhapus',
            text: 'Pengguna berhasil dihapus',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#3b82f6'
          });
          fetchUsers();
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: err.message || 'Gagal menghapus pengguna',
            background: '#111827',
            color: '#fff',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <UsersIcon className="text-blue-500 animate-pulse" /> Kelola Pengguna OSIM
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Mengatur daftar anggota, edit password, dan hak akses</p>
        </div>
        
        <button 
          onClick={handleAddUser} 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus size={18} /> Tambah Anggota
        </button>
      </div>

      <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-500" />
                </div>
                <input 
                    type="text" 
                    placeholder="Cari user OSIM..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white placeholder-gray-500"
                />
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Total: {filteredUsers.length} Pengguna
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 font-semibold">
                    <tr>
                        <th className="px-6 py-4">USERNAME</th>
                        <th className="px-6 py-4">ROLE HAK AKSES</th>
                        <th className="px-6 py-4">NOMOR WHATSAPP</th>
                        <th className="px-6 py-4 text-center">AKSI MANAJEMEN</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loading ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-gray-500">
                            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p>Mengambil data user...</p>
                          </td>
                        </tr>
                    ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-gray-500">
                            <UserX className="mx-auto text-gray-600 mb-2" size={32} />
                            <p>Tidak ada pengguna ditemukan.</p>
                          </td>
                        </tr>
                    ) : filteredUsers.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
                                  {userItem.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold dark:text-white">{userItem.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 dark:text-gray-300">
                                <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center w-fit gap-1.5 ${
                                    userItem.role === 'admin' 
                                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' 
                                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                }`}>
                                    <Shield size={12} />
                                    {userItem.role === 'admin' ? 'Admin / Pengurus' : 'Anggota Sekretariat'}
                                </span>
                            </td>
                            <td className="px-6 py-4 dark:text-gray-300 font-mono text-sm">
                                {userItem.nomor_wa || <span className="text-gray-500 text-xs italic">Belum diisi</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center items-center gap-1">
                                <button 
                                  onClick={() => handleEditUser(userItem)}
                                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                  title="Edit Pengguna & Password"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(userItem)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
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
