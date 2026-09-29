'use client';

import { useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import ChooseFileButton from './ChooseFileButton';
import BackButton from './BackButton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ImageEncryptionVisualizer({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{
    original: string;
    ecb: string;
    secure: string;
  } | null>(null);

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
      
      // Create local URL for original image
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
              <>
                <ImageIcon className="w-4 h-4" />
                Mulai Visualisasi
              </>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
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
      )}
    </div>
  );
}
