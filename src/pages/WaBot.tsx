import React, { useState, useEffect } from 'react';
import { Bot, Play, Square, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { safeFetchJson } from '@/src/lib/utils';

export default function WaBot() {
  const [status, setStatus] = useState('Disconnected');
  const [qr, setQr] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/wa/status');
      const data = await safeFetchJson(res, { status: 'Disconnected', qr: null });
      setStatus(data.status);
      setQr(data.qr);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    await fetch('/api/wa/start', { method: 'POST' });
    fetchStatus();
  };

  const handleStop = async () => {
    await fetch('/api/wa/stop', { method: 'POST' });
    fetchStatus();
  };

  const testMessage = async () => {
      Swal.fire({
          title: 'Test Pesan WA',
          input: 'text',
          inputLabel: 'Masukkan Nomor WhatsApp (awali dengan 08)',
          showCancelButton: true
      }).then(async (result) => {
          if (result.value) {
              const res = await fetch('/api/wa/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone: result.value, message: 'Halo! Ini adalah pesan test dari Sistem Sekretariat OSIM.' })
              });
              const data = await safeFetchJson(res, { error: 'Gagal mengirim pesan dari sistem' });
              if (res.ok) Swal.fire('Berhasil', 'Pesan terkirim', 'success');
              else Swal.fire('Gagal', data.error || 'Terjadi kesalahan sistem', 'error');
          }
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Bot className="text-blue-500" /> WhatsApp Bot Server
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Sistem notifikasi dan pengingat otomatis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  {qr ? (
                      <img src={qr} alt="QR Code" className="w-44 h-44 rounded-lg" />
                  ) : (
                      <div className="text-gray-400 p-4">
                          <Bot size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">{
                              status === 'Connected' ? 'Bot Terhubung!' : 
                              status === 'Scan QR Code' ? 'Menunggu QR...' : 
                              'Bot Disconnected'
                          }</p>
                      </div>
                  )}
              </div>
              
              <div className="flex gap-2 w-full">
                  <button onClick={handleStart} disabled={status !== 'Disconnected'} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2">
                      <Play size={16} /> Mulai
                  </button>
                  <button onClick={handleStop} disabled={status === 'Disconnected'} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2">
                      <Square size={16} /> Stop
                  </button>
              </div>
          </div>
          
          <div className="md:col-span-2 space-y-6">
             <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                 <h3 className="font-semibold dark:text-white mb-4">Status & Pengaturan</h3>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                         <div>
                             <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status Koneksi</p>
                             <p className="font-bold dark:text-white mt-1 flex items-center gap-2">
                                 <span className={`w-3 h-3 rounded-full ${status === 'Connected' ? 'bg-emerald-500' : status === 'Scan QR Code' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                 {status}
                             </p>
                         </div>
                         <button onClick={fetchStatus} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg"><RefreshCw size={18} /></button>
                     </div>
                     <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                         <button onClick={testMessage} disabled={status !== 'Connected'} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full sm:w-auto">
                             Test Kirim Pesan
                         </button>
                     </div>
                 </div>
             </div>
             
             <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                 <h3 className="font-semibold dark:text-white mb-4">Tutorial Penggunaan</h3>
                 <ol className="list-decimal text-sm dark:text-gray-300 space-y-2 ml-4">
                     <li>Klik tombol "Mulai" untuk menghidupkan server bot WhatsApp.</li>
                     <li>Tunggu hingga QR Code muncul di kotak sebelah kiri.</li>
                     <li>Buka aplikasi WhatsApp di HP sekretariat.</li>
                     <li>Pilih "Perangkat Tertaut" dan scan QR Code tersebut.</li>
                     <li>Bot siap digunakan untuk mengirim jadwal piket otomatis!</li>
                 </ol>
             </div>
          </div>
      </div>
    </div>
  );
}
