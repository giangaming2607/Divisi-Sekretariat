import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Camera, Music, Image as ImageIcon, Trash2, Settings, Plus, Play, Pause, Upload, ZoomIn, ZoomOut, LayoutGrid, X } from 'lucide-react';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../lib/store';
import { cn } from '../lib/utils';
import {
  clientGetAlbums,
  clientAddAlbum,
  clientDeleteAlbum,
  clientGetAlbumSettings,
  clientSaveAlbumSettings,
  AlbumItem,
  AlbumSettings
} from '../lib/firebaseClient';

export default function Album() {
  const { user } = useAuthStore();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [settings, setSettings] = useState<AlbumSettings>({ songUrl: '', songStartTime: 0 });
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');
  const playerRef = useRef<ReactPlayer>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [albumData, settingsData] = await Promise.all([
        clientGetAlbums(),
        clientGetAlbumSettings()
      ]);
      setAlbums(albumData);
      setSettings({ songStartTime: 0, ...settingsData });
    } catch (error) {
      console.error('Error fetching album data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isSpotify = settings.songUrl?.includes('spotify.com');
  let spotifyEmbedUrl = '';
  if (isSpotify) {
    // Convert regular spotify url to embed url
    const trackIdMatch = settings.songUrl.match(/track\/([a-zA-Z0-9]+)/);
    if (trackIdMatch && trackIdMatch[1]) {
      spotifyEmbedUrl = `https://open.spotify.com/embed/track/${trackIdMatch[1]}?utm_source=generator`;
    } else {
      spotifyEmbedUrl = settings.songUrl; // fallback
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleEditAudio = () => {
    if (user?.role !== 'admin') return;

    Swal.fire({
      title: 'Pengaturan Album',
      html: `
        <div class="text-left mb-4">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Album</label>
          <input id="swal-title" value="${settings.title || 'Album Kenangan OSIM'}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl mb-3" placeholder="Contoh: Album Kenangan">
          
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Deskripsi Album</label>
          <textarea id="swal-desc" class="swal2-textarea !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl mb-3 text-sm" placeholder="Deskripsi album...">${settings.description || 'Menyimpan setiap momen berharga, suka duka, dan perjuangan kita bersama di ruang Sekretariat.'}</textarea>

          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Upload Lagu (Hanya File MP3)</label>
          <div class="flex gap-2 items-center mb-1">
            <input type="file" id="swal-song-file" accept="audio/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-pink-500/20 file:text-pink-400 hover:file:bg-pink-500/30">
            <button type="button" id="swal-test-audio" class="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-colors w-max whitespace-nowrap shadow-lg flex-shrink-0">Test</button>
          </div>
          <p class="text-[10px] text-pink-400 mb-3">* Maksimal ukuran file 1MB. Gunakan file audio yang lebih kecil (kompresi MP3) karena database terbatas.</p>
          
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mulai Dari (Detik)</label>
          <input id="swal-song-start" type="number" min="0" value="${settings.songStartTime || 0}" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl mb-1" placeholder="0">
          <p class="text-[10px] text-gray-500 mb-3">Contoh: 30 untuk mulai dari detik 30.</p>

          <div id="swal-test-container" class="mt-4 hidden w-full rounded-xl overflow-hidden"></div>
        </div>
      `,
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#3b82f6',
      didOpen: () => {
        const testBtn = document.getElementById('swal-test-audio');
        const container = document.getElementById('swal-test-container');
        const fileInput = document.getElementById('swal-song-file') as HTMLInputElement;
        
        testBtn?.addEventListener('click', () => {
           const startTime = parseInt((document.getElementById('swal-song-start') as HTMLInputElement).value) || 0;
           
           if (fileInput.files && fileInput.files.length > 0) {
             const file = fileInput.files[0];
             const objectUrl = URL.createObjectURL(file);
             if (container) {
               container.classList.remove('hidden');
               container.innerHTML = `<audio controls autoplay src="${objectUrl}#t=${startTime}" class="w-full h-12 bg-gray-800 rounded-xl"></audio>`;
             }
           } else {
             Swal.showValidationMessage('Silakan pilih file lagu terlebih dahulu');
           }
        });
      },
      preConfirm: async () => {
        const fileInput = document.getElementById('swal-song-file') as HTMLInputElement;
        let songUrl = settings.songUrl || '';

        if (fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file.size > 1000000) { // 1MB limit for firestore
             Swal.showValidationMessage('Ukuran file maksimal 1MB. Gunakan file audio yang lebih kecil.');
             return false;
          }
          songUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        return {
          title: (document.getElementById('swal-title') as HTMLInputElement).value.trim(),
          description: (document.getElementById('swal-desc') as HTMLTextAreaElement).value.trim(),
          songUrl: songUrl,
          songStartTime: parseInt((document.getElementById('swal-song-start') as HTMLInputElement).value) || 0
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientSaveAlbumSettings(result.value);
          setSettings(result.value);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Pengaturan album diperbarui',
            
            
            confirmButtonColor: '#3b82f6'
          });
        } catch (error) {
           Swal.fire('Error', 'Gagal menyimpan pengaturan album', 'error');
        }
      }
    });
  };

  const handleAddPhoto = () => {
    if (user?.role !== 'admin') return;

    Swal.fire({
      title: 'Tambah Foto',
      html: `
        <div class="text-left mb-4">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Upload File Foto</label>
          <input type="file" id="swal-file-upload" accept="image/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30">
        </div>
        <div class="text-center text-sm text-gray-500 mb-2 font-bold">- ATAU -</div>
        <div class="text-left mb-4">
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">URL Cover / Image URL</label>
          <input id="swal-image-url" class="swal2-input !m-0 !w-full bg-gray-900 border border-gray-700 text-white rounded-xl" placeholder="https://example.com/image.jpg">
        </div>
      `,
      
      
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#3b82f6',
      preConfirm: async () => {
        const fileInput = document.getElementById('swal-file-upload') as HTMLInputElement;
        const urlInput = (document.getElementById('swal-image-url') as HTMLInputElement).value.trim();

        if (fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        } else if (urlInput) {
          return urlInput;
        }

        Swal.showValidationMessage('Harap pilih file foto atau masukkan URL');
        return false;
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          await clientAddAlbum({ url: result.value as string });
          fetchData();
          Swal.fire({
             icon: 'success',
             title: 'Berhasil',
             text: 'Foto berhasil ditambahkan!',
             
             
             confirmButtonColor: '#3b82f6'
          });
        } catch (error) {
          Swal.fire('Error', 'Gagal menambahkan foto. Jika upload, coba ukuran yang lebih kecil.', 'error');
        }
      }
    });
  };

  const handleDelete = (id: number) => {
    if (user?.role !== 'admin') return;

    Swal.fire({
      title: 'Hapus foto ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, hapus!',
      
      
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await clientDeleteAlbum(id);
          fetchData();
          Swal.fire({
             icon: 'success',
             title: 'Terhapus!',
             
             
             confirmButtonColor: '#3b82f6'
          });
        } catch (err) {
          Swal.fire('Error', 'Terjadi kesalahan saat menghapus.', 'error');
        }
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {!isSpotify && settings.songUrl && (
        <div className="hidden">
          <ReactPlayer 
            ref={playerRef}
            url={settings.songUrl} 
            playing={isPlaying} 
            loop={true} 
            width="0" 
            height="0"
            onStart={() => {
              if (settings.songStartTime) {
                 playerRef.current?.seekTo(settings.songStartTime);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            config={{
              youtube: {
                playerVars: { 
                  autoplay: 0,
                  start: settings.songStartTime || 0
                }
              },
              file: {
                attributes: {}
              }
            }}
          />
        </div>
      )}

      {/* Header section designed like a digital invitation */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
        className="bg-gradient-to-br from-pink-900/40 via-purple-900/40 to-blue-900/40 p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center mt-6"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="z-10 bg-black/30 p-4 rounded-full backdrop-blur-md mb-6 border border-white/20 animate-pulse">
          <Camera size={32} className="text-pink-300" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 mb-4 z-10 font-serif whitespace-pre-wrap">
          {settings.title || 'Album Kenangan OSIM'}
        </h1>
        <p className="text-gray-300 max-w-lg mx-auto z-10 leading-relaxed font-medium whitespace-pre-wrap">
          {settings.description || 'Menyimpan setiap momen berharga, suka duka, dan perjuangan kita bersama di ruang Sekretariat.'}
        </p>

        {/* Music Player & Admin Controls */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 z-10 w-full max-w-md">
          {user?.role === 'admin' && (
            <div className="flex flex-wrap justify-center gap-4 w-full">
              <button 
                onClick={handleEditAudio}
                className="bg-indigo-600/50 hover:bg-indigo-600/80 text-white border border-indigo-500/50 px-5 py-3 rounded-full flex items-center gap-2 backdrop-blur-md transition-all shadow-xl"
              >
                <Settings size={18} /> Pengaturan
              </button>
              <button 
                onClick={handleAddPhoto}
                className="bg-pink-600/50 hover:bg-pink-600/80 text-white border border-pink-500/50 px-5 py-3 rounded-full flex items-center gap-2 backdrop-blur-md transition-all shadow-xl"
              >
                <Upload size={18} /> Tambah Foto
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-between items-center mt-8"
      >
         <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <ImageIcon className="text-pink-500" /> Galeri Kenangan
         </h3>
         <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setGridSize('large')} 
              className={cn("p-2 rounded-lg transition-colors", gridSize === 'large' ? 'bg-white dark:bg-gray-700 shadow-sm text-pink-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
              title="Foto Besar"
            >
               <ZoomIn size={18} />
            </button>
            <button 
              onClick={() => setGridSize('medium')} 
              className={cn("p-2 rounded-lg transition-colors", gridSize === 'medium' ? 'bg-white dark:bg-gray-700 shadow-sm text-pink-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
              title="Foto Sedang"
            >
               <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setGridSize('small')} 
              className={cn("p-2 rounded-lg transition-colors", gridSize === 'small' ? 'bg-white dark:bg-gray-700 shadow-sm text-pink-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}
              title="Foto Kecil"
            >
               <ZoomOut size={18} />
            </button>
         </div>
      </motion.div>

      {/* Grid Photos */}
      <motion.div 
        layout
        className={cn(
          "grid gap-4 transition-all duration-500",
          gridSize === 'small' && "grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
          gridSize === 'medium' && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          gridSize === 'large' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        <AnimatePresence mode="popLayout">
        {loading ? (
           Array.from({ length: 4 }).map((_, i) => (
             <motion.div 
               key={`skeleton-${i}`}
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.8 }}
               className="aspect-[4/3] bg-white/5 animate-pulse rounded-2xl border border-gray-200 dark:border-white/10"
             ></motion.div>
           ))
        ) : albums.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500"
           >
             <ImageIcon size={48} className="mb-4 opacity-50 text-gray-600" />
             <p className="font-semibold text-lg">Belum ada foto kenangan</p>
             <p className="text-sm mt-1">Admin dapat mulai menambahkan momen berharga di sini.</p>
           </motion.div>
        ) : (
          albums.map((album, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              key={album.id} 
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/20 cursor-pointer"
              onClick={() => setSelectedImage(album.url)}
            >
              <img 
                src={album.url} 
                alt="Kenangan" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {user?.role === 'admin' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(album.id); }}
                  className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"
                  title="Hapus foto ini"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          ))
        )}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox for full screen image view */}
      <AnimatePresence>
      {selectedImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedImage(null)}
        >
           <button 
             onClick={() => setSelectedImage(null)}
             className="absolute top-6 right-6 lg:top-10 lg:right-10 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-all border border-white/20 shadow-xl"
           >
             <X size={24} />
           </button>
           
           <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImage} 
              alt="Fullscreen view" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
           />
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
