import React, { useState, useEffect } from 'react';
import { Bot, Play, Square, RefreshCw, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { safeFetchJson } from '@/src/lib/utils';

export default function WaBot() {
  const [status, setStatus] = useState('Disconnected');
  const [qr, setQr] = useState<string | null>(null);
  const [serverlessMode, setServerlessMode] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/wa/status');
      if (!res.ok) {
        throw new Error('Not found');
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // We are on a static/serverless host like Vercel where backend and SQLite do not run
        setServerlessMode(true);
        setStatus('Serverless Mode Active');
        setQr(null);
        return;
      }

      const data = await safeFetchJson(res, { status: 'Disconnected', qr: null });
      setStatus(data.status);
      setQr(data.qr);
    } catch (e) {
      // If endpoint is unreachable (like on Vercel or when backend is down/unresolvable), set to Serverless Mode
      setServerlessMode(true);
      setStatus('Serverless Mode Active');
      setQr(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (serverlessMode) {
      Swal.fire({
        icon: 'info',
        title: 'Info Serverless',
        text: 'Mode serverless menggunakan direct-redireksi browser. Tidak membutuhkan koneksi bot server!',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    Swal.fire({
      title: 'Menghidupkan Bot...',
      text: 'Mohon tunggu 3-5 detik selagi server menginisialisasi modul WhatsApp.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#111827',
      color: '#fff'
    });

    try {
      const res = await fetch('/api/wa/start', { method: 'POST' });
      await fetchStatus();
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Bot Dimulai!',
        text: 'Proses aktivasi WA Bot berhasil dipicu. Silakan scan QR code jika status berubah menjadi Scan QR.',
        confirmButtonColor: '#3b82f6',
        background: '#111827',
        color: '#fff'
      });
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat Sesi',
        text: err.message || 'Gagal menghubungi server backend WhatsApp.',
        confirmButtonColor: '#ef4444',
        background: '#111827',
        color: '#fff'
      });
    }
  };

  const handleStop = async () => {
    if (serverlessMode) return;

    Swal.fire({
      title: 'Mematikan Bot...',
      text: 'Menghapus sesi & memutuskan koneksi...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: '#111827',
      color: '#fff'
    });

    try {
      await fetch('/api/wa/stop', { method: 'POST' });
      await fetchStatus();
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Sukses Disconnect',
        text: 'Sesi bot WhatsApp berhasil dinonaktifkan.',
        confirmButtonColor: '#3b82f6',
        background: '#111827',
        color: '#fff'
      });
    } catch (err: any) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mematikan Sesi',
        text: err.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#ef4444',
        background: '#111827',
        color: '#fff'
      });
    }
  };

  const testMessage = async () => {
      Swal.fire({
          title: 'Test Pesan WA',
          input: 'text',
          inputPlaceholder: 'Contoh: 08123456789',
          inputLabel: 'Masukkan Nomor WhatsApp Anda',
          showCancelButton: true,
          confirmButtonColor: '#3b82f6',
          cancelButtonColor: '#ef4444',
          confirmButtonText: 'Kirim Test',
          cancelButtonText: 'Batal'
      }).then(async (result) => {
          if (result.value) {
              const cleanNumber = result.value.replace(/^0+/, '62').replace(/\D/g, '');
              const messageText = 'Halo! Ini adalah pesan test dari Sistem Sekretariat OSIM (Serverless Mode)';

              if (serverlessMode) {
                  const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageText)}`;
                  window.open(waUrl, '_blank');
                  Swal.fire('Dialihkan', 'WhatsApp Bot server tidak aktif. Pesan telah dialihkan ke browser Anda!', 'success');
                  return;
              }

              try {
                  const res = await fetch('/api/wa/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phone: result.value, message: messageText })
                  });
                  const data = await safeFetchJson(res, { error: 'Gagal mengirim pesan dari sistem' });
                  if (res.ok) Swal.fire('Berhasil', 'Pesan terkirim via bot server', 'success');
                  else Swal.fire('Gagal', data.error || 'Terjadi kesalahan sistem', 'error');
              } catch (e) {
                  // Fallback
                  const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(messageText)}`;
                  window.open(waUrl, '_blank');
              }
          }
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Bot className="text-blue-500" /> WhatsApp Bot Server
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sistem notifikasi dan pengingat otomatis</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-white/5 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-250 dark:border-gray-800 rounded-3xl p-6 shadow-xl">
        <h3 className="font-semibold dark:text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
          ⚙️ Mode Operasional Pengiriman WhatsApp
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
          Pilih metode pengiriman yang Anda inginkan. Anda dapat menggunakan Bot Server terintegrasi atau beralih ke Link Direct manual jika server backend sedang offline.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setServerlessMode(false)}
            type="button"
            className={`p-4 rounded-2xl border text-left transition-all ${
              !serverlessMode
                ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-100 ring-4 ring-blue-500/10'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/20 text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-sm sm:text-base">
              <span>🤖</span> Bot Server Otomatis
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              Bot berjalan di server sekretariat OSIM, mengirim pesan secara otomatis setelah Anda menscan QR Code sekali saja.
            </p>
          </button>

          <button
            onClick={() => setServerlessMode(true)}
            type="button"
            className={`p-4 rounded-2xl border text-left transition-all ${
              serverlessMode
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-4 ring-emerald-500/10'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/20 text-gray-500 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-sm sm:text-base">
              <span>🌐</span> Link Direct Browser (Serverless)
            </div>
            <p className="text-xs opacity-80 leading-relaxed">
              Tidak membutuhkan koneksi Bot. Pengiriman dialihkan langsung ke website atau aplikasi WhatsApp Web di perangkat Anda sendiri.
            </p>
          </button>
        </div>
      </div>

      {serverlessMode && (
        <div className="bg-blue-600/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-fade-in">
          <AlertCircle size={24} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">ℹ️ Deteksi Serverless Teraktifkan (Vercel / Static Host)</h4>
            <p className="leading-relaxed opacity-90">
              Sistem mendeteksi bahwa aplikasi ini berjalan di hosting statis (Vercel/Github Pages). Karena hosting statis tidak mendukung server Node.js di background untuk menghubungkan sesi WhatsApp secara mandiri, <strong>Mode Link Direct Browser otomatis diaktifkan untuk Anda.</strong>
            </p>
            <p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
               ✓ Anda tetap dapat mengirim pengingat jadwal piket secara praktis! Sistem akan mengarahkan pesan langsung ke WhatsApp Web / aplikasi di HP Anda.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  {qr && !serverlessMode ? (
                      <img src={qr} alt="QR Code" className="w-44 h-44 rounded-lg shadow-sm" />
                  ) : (
                      <div className="text-gray-400 p-4">
                          <Bot size={48} className="mx-auto mb-2 opacity-50 text-blue-500" />
                          <p className="text-xs sm:text-sm font-medium">{
                              serverlessMode ? 'Browser-Redirection Aktif' :
                              status === 'Connected' ? 'Bot Terhubung!' : 
                              status === 'Scan QR Code' ? 'Menunggu QR...' : 
                              'Bot Disconnected'
                          }</p>
                      </div>
                  )}
              </div>
              
              <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleStart} 
                    disabled={serverlessMode || status !== 'Disconnected'} 
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-md active:scale-95"
                  >
                      <Play size={16} /> Mulai
                  </button>
                  <button 
                    onClick={handleStop} 
                    disabled={serverlessMode || status === 'Disconnected'} 
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-md active:scale-95"
                  >
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
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Status Koneksi</p>
                              <p className="font-bold dark:text-white mt-1 flex items-center gap-2 text-sm sm:text-base">
                                  <span className={`w-3 h-3 rounded-full ${
                                      serverlessMode ? 'bg-blue-500 animate-pulse' :
                                      status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 
                                      status === 'Scan QR Code' ? 'bg-amber-500 animate-bounce' : 'bg-red-500'
                                  }`}></span>
                                  {serverlessMode ? 'Serverless Direct Link Mode' : status}
                              </p>
                          </div>
                          <button onClick={fetchStatus} disabled={serverlessMode} className="p-2 text-gray-450 hover:text-white bg-gray-800 rounded-lg disabled:opacity-30 cursor-pointer" title="Perbarui Status"><RefreshCw size={18} /></button>
                      </div>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                          <button onClick={testMessage} className="bg-emerald-650 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors w-full sm:w-auto text-xs sm:text-sm shadow-md">
                              Test Kirim Pesan
                          </button>
                      </div>
                  </div>
             </div>
             
             <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold dark:text-white mb-4">Tutorial Penggunaan {serverlessMode ? '(Mode Pengalihan Link)' : ''}</h3>
                  {serverlessMode ? (
                      <ol className="list-decimal text-xs sm:text-sm dark:text-gray-300 space-y-2 ml-4">
                          <li>Menu reminder jadwal piket ("Kirim Pesan" dan "Test Kirim Pesan") akan otomatis merumuskan detail reminder secara instan.</li>
                          <li>Saat diklik, browser Anda akan otomatis membuka tab WhatsApp Web atau aplikasi seluler Anda dengan teks reminder yang telah terisi lengkap.</li>
                          <li>Cukup tekan "Kirim" di aplikasi WhatsApp Anda untuk menyelesaikan pengiriman.</li>
                          <li>Sederhana, aman, 100% gratis, dan tidak membutuhkan instalasi server bot!</li>
                      </ol>
                  ) : (
                      <ol className="list-decimal text-xs sm:text-sm dark:text-gray-300 space-y-2 ml-4">
                          <li>Klik tombol "Mulai" untuk menghidupkan server bot WhatsApp di background.</li>
                          <li>Tunggu beberapa detik hingga status berubah menjadi <b>Scan QR Code</b> dan kode QR dimuat di kotak sebelah kiri.</li>
                          <li>Buka aplikasi WhatsApp di HP sekretariat.</li>
                          <li>Pilih "Perangkat Tertaut" dan scan QR Code tersebut.</li>
                          <li>Bot siap digunakan untuk mengirim jadwal piket otomatis!</li>
                      </ol>
                  )}
             </div>
          </div>
      </div>
    </div>
  );
}
