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
      const data = await safeFetchJson(res, { status: 'Disconnected', qr: null });
      setStatus(data.status);
      setQr(data.qr);
      setServerlessMode(false);
    } catch (e) {
      // If endpoint is unreachable (like on a pure static serverless host), mark as serverless-mode active
      setServerlessMode(true);
      setStatus('Serverless Redirection Ready');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (serverlessMode) {
      Swal.fire('Info Serverless', 'Mode serverless menggunakan direct-redireksi browser. Tidak membutuhkan koneksi bot server!', 'info');
      return;
    }
    await fetch('/api/wa/start', { method: 'POST' });
    fetchStatus();
  };

  const handleStop = async () => {
    if (serverlessMode) return;
    await fetch('/api/wa/stop', { method: 'POST' });
    fetchStatus();
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
      <div>
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Bot className="text-blue-500" /> WhatsApp Bot Server
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Sistem notifikasi dan pengingat otomatis</p>
      </div>

      {serverlessMode && (
        <div className="bg-blue-600/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={24} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">Informasi Hosting Serverless (Vercel / Netlify / GitHub Pages)</h4>
            <p className="leading-relaxed">
              Anda mendeteksi lingkungan static-hosting serverless gratis. Karena platform Vercel/Netlify tidak mendukung server backend jangka panjang untuk WhatsApp Automation, <strong>fitur pengiriman reminder Jadwal Piket telah otomatis dialihkan ke mode browser-direct-redirection</strong>. 
            </p>
            <p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
               ✓ Reminder tetap dapat dikirimkan secara gratis menggunakan WhatsApp Web / App Anda tanpa memerlukan administrasi Bot server yang rumit!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  {qr && !serverlessMode ? (
                      <img src={qr} alt="QR Code" className="w-44 h-44 rounded-lg" />
                  ) : (
                      <div className="text-gray-400 p-4">
                          <Bot size={48} className="mx-auto mb-2 opacity-50 text-blue-500" />
                          <p className="text-sm font-medium">{
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
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                  >
                      <Play size={16} /> Mulai
                  </button>
                  <button 
                    onClick={handleStop} 
                    disabled={serverlessMode || status === 'Disconnected'} 
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
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
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status Koneksi</p>
                              <p className="font-bold dark:text-white mt-1 flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${
                                      serverlessMode ? 'bg-blue-500 animate-pulse' :
                                      status === 'Connected' ? 'bg-emerald-500' : 
                                      status === 'Scan QR Code' ? 'bg-amber-500' : 'bg-red-500'
                                  }`}></span>
                                  {serverlessMode ? 'Serverless Direct Link Mode' : status}
                              </p>
                          </div>
                          <button onClick={fetchStatus} disabled={serverlessMode} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg disabled:opacity-40"><RefreshCw size={18} /></button>
                      </div>
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                          <button onClick={testMessage} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full sm:w-auto text-sm shadow-md">
                              Test Kirim Pesan
                          </button>
                      </div>
                  </div>
             </div>
             
             <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold dark:text-white mb-4">Tutorial Penggunaan {serverlessMode ? '(Mode Pengalihan Link)' : ''}</h3>
                  {serverlessMode ? (
                      <ol className="list-decimal text-sm dark:text-gray-300 space-y-2 ml-4">
                          <li>Menu reminder jadwal piket ("Kirim Pesan" dan "Test Kirim Pesan") akan otomatis merumuskan detail reminder secara instan.</li>
                          <li>Saat diklik, browser Anda akan otomatis membuka tab WhatsApp Web atau aplikasi seluler Anda dengan teks reminder yang telah terisi lengkap.</li>
                          <li>Cukup tekan "Kirim" di aplikasi WhatsApp Anda untuk menyelesaikan pengiriman.</li>
                          <li>Sederhana, aman, 100% gratis, dan tidak membutuhkan instalasi server bot!</li>
                      </ol>
                  ) : (
                      <ol className="list-decimal text-sm dark:text-gray-300 space-y-2 ml-4">
                          <li>Klik tombol "Mulai" untuk menghidupkan server bot WhatsApp.</li>
                          <li>Tunggu hingga QR Code muncul di kotak sebelah kiri.</li>
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
