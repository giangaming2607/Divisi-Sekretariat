import React, { useState, useEffect } from 'react';
import { Hammer, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { clientGetRenovasiSettings, clientSaveRenovasiSettings, RenovasiSettings } from '../lib/firebaseClient';
import { cn } from '../lib/utils';

const VIEWER_MENUS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Inventaris', path: '/inventaris' },
  { label: 'Jadwal Piket', path: '/piket' },
  { label: 'Album Kenangan', path: '/album' }
];

export default function RenovasiAdmin() {
  const [settings, setSettings] = useState<RenovasiSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const data = await clientGetRenovasiSettings();
    setSettings(data);
    setLoading(false);
  };

  const toggleRenovasi = async (path: string, currentStatus: boolean) => {
    setSaving(path);
    const updatedSettings = {
      ...settings,
      [path]: !currentStatus
    };
    
    try {
      await clientSaveRenovasiSettings(updatedSettings);
      setSettings(updatedSettings);
      Swal.fire({
        title: 'Berhasil',
        text: `Status renovasi untuk menu ${VIEWER_MENUS.find(m => m.path === path)?.label} telah di${!currentStatus ? 'aktifkan' : 'nonaktifkan'}.`,
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      Swal.fire({
        title: 'Gagal',
        text: 'Terjadi kesalahan saat menyimpan pengaturan.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Hammer className="text-yellow-500" /> Mode Renovasi Menu
          </h2>
          <p className="text-gray-400 mt-1">Atur menu mana saja yang sedang dalam perbaikan.</p>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {VIEWER_MENUS.map(menu => {
              const isUnderRenovation = !!settings[menu.path];
              return (
                <div key={menu.path} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{menu.label}</h3>
                    <p className="text-sm text-gray-400">Path: {menu.path}</p>
                    {isUnderRenovation && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 mt-2 border border-yellow-500/20">
                        <Hammer size={12} /> Sedang Direnovasi
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleRenovasi(menu.path, isUnderRenovation)}
                    disabled={saving === menu.path}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 min-w-[140px]",
                      isUnderRenovation 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20",
                      saving === menu.path && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {saving === menu.path ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : isUnderRenovation ? (
                      <>Nonaktifkan Renovasi</>
                    ) : (
                      <><Hammer size={16} /> Renovasi</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
