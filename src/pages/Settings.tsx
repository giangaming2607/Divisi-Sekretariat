import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { safeFetchJson } from '@/src/lib/utils';

export default function Settings() {
  const [settings, setSettings] = useState({
     nama_sekolah: '',
     periode: '',
     wa_admin: '',
     login_logo: ''
  });

  useEffect(() => {
     fetch('/api/settings').then(res => safeFetchJson<any>(res, {})).then(data => {
         setSettings({
             nama_sekolah: data.nama_sekolah || '',
             periode: data.periode || '',
             wa_admin: data.wa_admin || '',
             login_logo: data.login_logo || ''
         });
     })
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      
      for (const [key, value] of Object.entries(settings)) {
          await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key, value })
          });
      }
      
      Swal.fire({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
          icon: 'success', title: 'Pengaturan disimpan', background: '#1f2937', color: '#fff'
      })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <SettingsIcon className="text-gray-400" /> Pengaturan Sistem
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Konfigurasi variabel global aplikasi</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
         <div className="space-y-4">
             <div>
                 <label className="block text-sm font-medium dark:text-gray-300 mb-1">Nama Sekolah / Instansi</label>
                 <input type="text" name="nama_sekolah" value={settings.nama_sekolah} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all" />
             </div>
             <div>
                 <label className="block text-sm font-medium dark:text-gray-300 mb-1">Periode Jabatan</label>
                 <input type="text" name="periode" value={settings.periode} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all" placeholder="2023/2024" />
             </div>
             <div>
                 <label className="block text-sm font-medium dark:text-gray-300 mb-1">Nomor WhatsApp Admin (Notifikasi Default)</label>
                 <input type="text" name="wa_admin" value={settings.wa_admin} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all" />
             </div>
             <div>
                 <label className="block text-sm font-medium dark:text-gray-300 mb-1">Logo Halaman Login (URL Gambar, Base64, atau Emoji / Karakter)</label>
                 <div className="flex flex-col sm:flex-row gap-3">
                     <input 
                         type="text" 
                         name="login_logo" 
                         value={settings.login_logo} 
                         onChange={handleChange} 
                         className="flex-1 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all" 
                         placeholder="Misal: 🤖, atau URL Gambar" 
                     />
                     <label className="cursor-pointer bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold px-4 py-2.5 rounded-xl border border-blue-500/20 transition-colors flex items-center justify-center text-sm whitespace-nowrap">
                         Unggah Logo
                         <input 
                             type="file" 
                             accept="image/*" 
                             onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                     const reader = new FileReader();
                                     reader.onloadend = () => {
                                         setSettings(prev => ({ ...prev, login_logo: reader.result as string }));
                                     };
                                     reader.readAsDataURL(file);
                                 }
                             }} 
                             className="hidden" 
                         />
                     </label>
                 </div>
                 {settings.login_logo && (
                     <div className="mt-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-950/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800 w-fit">
                         <span className="text-xs text-gray-400 font-medium font-mono">Pratinjau Logo:</span>
                         {settings.login_logo.startsWith('data:') || settings.login_logo.startsWith('http') ? (
                             <img src={settings.login_logo} alt="Preview Logo" className="w-12 h-12 object-contain rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white" />
                         ) : (
                             <div className="text-2xl w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                                 {settings.login_logo}
                             </div>
                         )}
                         <button 
                             type="button" 
                             onClick={() => setSettings(prev => ({ ...prev, login_logo: '' }))} 
                             className="text-xs text-red-500 hover:text-red-400 font-medium ml-2 hover:underline"
                         >
                             Hapus
                         </button>
                     </div>
                 )}
             </div>
         </div>
         
         <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
             <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30">
                 <Save size={18} /> Simpan Pengaturan
             </button>
         </div>
      </form>
    </div>
  );
}
