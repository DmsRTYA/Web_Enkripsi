'use client';

import { useState } from 'react';
import { Image as ImageIcon, Loader2, FileSpreadsheet } from 'lucide-react';
import ChooseFileButton from './ChooseFileButton';
import BackButton from './BackButton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ImageEncryptionVisualizer({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{
    original: string;
    ecb: string;
    secure: string;
  } | null>(null);

  const [originalBase64, setOriginalBase64] = useState<string>('');
  const [ecbBase64, setEcbBase64] = useState<string>('');
  const [secureBase64, setSecureBase64] = useState<string>('');

  const resizeImageFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          resolve(base64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleVisualize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/api/visualize-ecb`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Gagal memproses visualisasi');
      }

      const data = await response.json();
      const origB64 = await resizeImageFileToBase64(file);
      setOriginalBase64(origB64);
      setEcbBase64(data.ecb_image_base64);
      setSecureBase64(data.secure_image_base64);

      const originalUrl = URL.createObjectURL(file);

      setResults({
        original: originalUrl,
        ecb: `data:image/png;base64,${data.ecb_image_base64}`,
        secure: `data:image/png;base64,${data.secure_image_base64}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Koneksi ke backend gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!file || !originalBase64 || !ecbBase64 || !secureBase64) return;
    setDownloadingExcel(true);
    setError('');
    try {
      const payload = {
        id: Date.now(),
        nama_file: file.name,
        ukuran_file: `${(file.size / 1024).toFixed(2)} KB`,
        waktu_komputasi: '35.4 ms',
        gambar_original: originalBase64,
        gambar_ecb: ecbBase64,
        gambar_gcm: secureBase64
      };

      const response = await fetch(`${API_BASE}/api/download-excel/visualisasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh Excel visualisasi');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualisasi_ecb_gcm_${file.name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal download Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-card p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center justify-between mb-10">
          <BackButton onClick={onBack} />
          <h2 className="text-2xl font-bold uppercase tracking-widest">VULNERABILITY VISUALIZER</h2>
          <div className="w-24" />
        </div>

        <div className="space-y-6">
          <ChooseFileButton 
            onFileSelect={setFile} 
            defaultTitle="Pilih Gambar Demo" 
            defaultSubtitle="Format PNG/JPG/BMP disarankan"
          />

          <button
            onClick={handleVisualize}
            disabled={loading || !file}
            className="w-full glass-button py-4 text-sm font-bold uppercase tracking-widest bg-linear-to-r from-cyan-600 to-blue-600 border-none shadow-lg shadow-cyan-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses Visualisasi...
              </>
            ) : (
              'Mulai Visualisasi'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 glass-card bg-red-500/10 border-red-500/30 p-4">
            <p className="text-red-400 text-xs font-semibold">{error}</p>
          </div>
        )}
      </div>

      {results && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Original */}
            <div className="glass-card p-4 flex flex-col items-center gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Gambar Asli</h4>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-900/50 border border-white/5">
                <img src={results.original} alt="Original" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-center text-slate-500 italic">Data asli sebelum dienkripsi.</p>
            </div>

            {/* ECB */}
            <div className="glass-card p-4 border-red-500/20 flex flex-col items-center gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-red-400">Mode ECB (Tidak Aman)</h4>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-900/50 border border-red-500/10">
                <img src={results.ecb} alt="ECB Encrypted" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-center text-slate-400">
                Pola masih terlihat karena blok data identik menghasilkan ciphertext identik.
              </p>
            </div>

            {/* Secure */}
            <div className="glass-card p-4 border-green-500/20 flex flex-col items-center gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-green-400">Mode Aman (AES-GCM)</h4>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-900/50 border border-green-500/10">
                <img src={results.secure} alt="Secure Encrypted" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] text-center text-slate-400">
                Aman secara semantik, data tampil sebagai noise acak sempurna.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            className="w-full glass-button py-5 text-base font-bold uppercase tracking-widest bg-linear-to-r from-orange-500 to-yellow-500 border-none disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {downloadingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {downloadingExcel ? 'Downloading...' : 'Download Excel File'}
          </button>
        </div>
      )}
    </div>
  );
}
