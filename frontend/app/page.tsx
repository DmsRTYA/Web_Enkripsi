'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import BackgroundGlobal from '@/components/ui/BackgroundGlobal';
import SkewCard from '@/components/ui/SkewCard';
import BackButton from '@/components/ui/BackButton';
import ChooseFileButton from '@/components/ui/ChooseFileButton';

type Mode = 'menu' | 'encrypt' | 'decrypt';
type ContentType = 'text' | 'file';

const API_BASE = 'http://localhost:8000';

export default function Home() {
  const [mode, setMode] = useState<Mode>('menu');
  const [contentType, setContentType] = useState<ContentType>('text');
  const [loading, setLoading] = useState(false);

  const [textInput, setTextInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [algo, setAlgo] = useState('AES-GCM');
  const [textResult, setTextResult] = useState('');
  const [textError, setTextError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState('');
  const [fileAlgo, setFileAlgo] = useState('AES-GCM');
  const [fileResult, setFileResult] = useState('');
  const [fileError, setFileError] = useState('');

  const resetState = () => {
    setTextInput(''); setPassword(''); setTextResult(''); setTextError('');
    setFile(null); setFilePassword(''); setFileResult(''); setFileError('');
  };

  const handleEncryptText = async () => {
    if (!textInput.trim() || !password.trim()) { setTextError('Field wajib diisi'); return; }
    setLoading(true); setTextError(''); setTextResult('');
    try {
      const response = await fetch(`${API_BASE}/api/enkripsi/teks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: textInput, password_kripto: password, algo: algo }),
      });
      if (!response.ok) { const error = await response.json(); setTextError(error.detail || 'Enkripsi gagal'); }
      else { const data = await response.json(); setTextResult(data.ciphertext); }
    } catch (err) { setTextError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const handleDecryptText = async () => {
    if (!textInput.trim() || !password.trim()) { setTextError('Field wajib diisi'); return; }
    setLoading(true); setTextError(''); setTextResult('');
    try {
      const response = await fetch(`${API_BASE}/api/dekripsi/teks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: textInput, password_kripto: password, algo: algo }),
      });
      if (!response.ok) { const error = await response.json(); setTextError(error.detail || 'Dekripsi gagal'); }
      else { const data = await response.json(); setTextResult(data.plaintext); }
    } catch (err) { setTextError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const handleEncryptFile = async () => {
    if (!file || !filePassword.trim()) { setFileError('Field wajib diisi'); return; }
    setLoading(true); setFileError(''); setFileResult('');
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('password_kripto', filePassword); formData.append('algo', fileAlgo);
      const response = await fetch(`${API_BASE}/api/enkripsi/file`, { method: 'POST', body: formData });
      if (!response.ok) { const error = await response.json(); setFileError(error.detail || 'Enkripsi file gagal'); }
      else { const data = await response.json(); setFileResult(data.ciphertext); }
    } catch (err) { setFileError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const handleDecryptFile = async () => {
    if (!file || !filePassword.trim()) { setFileError('Field wajib diisi'); return; }
    setLoading(true); setFileError(''); setFileResult('');
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('password_kripto', filePassword); formData.append('algo', fileAlgo);
      const response = await fetch(`${API_BASE}/api/dekripsi/file`, { method: 'POST', body: formData });
      if (!response.ok) { const error = await response.json(); setFileError(error.detail || 'Dekripsi file gagal'); }
      else { const data = await response.json(); setFileResult(data.file_asli_b64); }
    } catch (err) { setFileError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const formatDecryptedFilename = (name: string): string => {
    if (name.endsWith('.enc')) name = name.slice(0, -4);
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const namePart = name.substring(0, lastDotIndex);
      const extPart = name.substring(lastDotIndex);
      return `${namePart}_hasil_dekripsi${extPart}`;
    }
    return `${name}_hasil_dekripsi`;
  };

  const downloadFile = (dataContent: string, originalName: string, isEncrypted: boolean) => {
    let filename = originalName;
    let blob: Blob;
    if (isEncrypted) {
      filename = `${originalName}.enc`;
      blob = new Blob([dataContent], { type: 'text/plain;charset=utf-8' });
    } else {
      const binaryString = atob(dataContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
      blob = new Blob([bytes], { type: 'application/octet-stream' });
      filename = formatDecryptedFilename(filename);
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Shader Background */}
      <div className="fixed inset-0 -z-10">
        <BackgroundGlobal />
      </div>

      {/* Header Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-6">
        <nav className="glass-nav px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white">KRIPTO</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">AES-GCM · ChaCha20</p>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150" />
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto pt-32 pb-16 px-6">
        {mode === 'menu' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-5xl font-bold tracking-tight text-white">Secure Encryption</h2>
              <p className="text-slate-400 text-lg">Military-grade cryptography at your fingertips</p>
            </div>

            <div className="flex flex-wrap justify-center gap-20">
              <SkewCard
                title="Encrypt"
                description="Lock your data with advanced encryption"
                gradientFrom="#ffbc00"
                gradientTo="#ff0058"
                iconVariant="encrypt"
                onClick={() => { setMode('encrypt'); resetState(); }}
              >
                <button 
                  onClick={() => { setMode('encrypt'); resetState(); }}
                  className="mt-auto w-full py-3 bg-white text-black font-bold rounded transition-all hover:bg-yellow-300"
                >
                  Start Encryption
                </button>
              </SkewCard>

              <SkewCard
                title="Decrypt"
                description="Unlock encrypted data securely"
                gradientFrom="#03a9f4"
                gradientTo="#ff0058"
                iconVariant="decrypt"
                onClick={() => { setMode('decrypt'); resetState(); }}
              >
                <button 
                  onClick={() => { setMode('decrypt'); resetState(); }}
                  className="mt-auto w-full py-3 bg-white text-black font-bold rounded transition-all hover:bg-yellow-300"
                >
                  Start Decryption
                </button>
              </SkewCard>
            </div>
          </div>
        )}

        {(mode === 'encrypt' || mode === 'decrypt') && (
          <div className="glass-card p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between mb-10">
              <BackButton onClick={() => { setMode('menu'); resetState(); }} />
              <h2 className="text-2xl font-bold uppercase tracking-widest">{mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'}</h2>
              <div className="w-24" />
            </div>

            <div className="flex gap-3 mb-10 glass-nav p-2 rounded-full">
              {['text', 'file'].map((type) => (
                <button key={type}
                  onClick={() => { setContentType(type as ContentType); resetState(); }}
                  className={`flex-1 rounded-full py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    contentType === type 
                      ? 'bg-linear-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-500/50' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {type}
                </button>
              ))}
            </div>

            {contentType === 'text' ? (
              <div className="space-y-6">
                <div className="form-group">
                  <div className="field-label">
                    <span>{mode === 'encrypt' ? 'Original Text' : 'Ciphertext'}</span>
                    <span className="char-counter">{textInput.length} characters</span>
                  </div>
                  <div className="input-wrapper">
                    <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)}
                      className="glass-textarea" placeholder="Enter your message..." />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="field-label">Password</label>
                    <div className="input-wrapper">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="glass-input" placeholder="Enter secret key..." />
                      <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="field-label">Algorithm</label>
                    <div className="input-wrapper">
                      <select value={algo} onChange={(e) => setAlgo(e.target.value)} className="glass-select">
                        <option>AES-GCM</option>
                        <option>ChaCha20-Poly1305</option>
                      </select>
                      <div className="select-chevron-icon"><ChevronDown /></div>
                    </div>
                  </div>
                </div>

                <button onClick={mode === 'encrypt' ? handleEncryptText : handleDecryptText} disabled={loading || !textInput.trim() || !password.trim()}
                  className="w-full glass-button py-5 text-base font-bold uppercase tracking-widest bg-linear-to-r from-orange-500 to-yellow-500 border-none primary-glow disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Processing...' : (mode === 'encrypt' ? 'Encrypt Now' : 'Decrypt Now')}
                </button>


                {textError && (
                  <div className="glass-card bg-red-500/10 border-red-500/30 p-5">
                    <p className="text-red-400 text-sm font-semibold">{textError}</p>
                  </div>
                )}

                {textResult && (
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-widest">Result</h3>
                      <button onClick={() => navigator.clipboard.writeText(textResult)} 
                        className="glass-button px-4 py-2 text-xs uppercase tracking-wider">
                        Copy
                      </button>
                    </div>
                    <div className="glass-input p-4 font-mono text-xs text-slate-300 break-all max-h-40 overflow-y-auto">
                      {textResult}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <ChooseFileButton onFileSelect={setFile} defaultTitle="Choose File" defaultSubtitle="Klik untuk memilih berkas" />

                <div className="form-row">
                  <div className="form-group">
                    <label className="field-label">Password</label>
                    <div className="input-wrapper">
                      <input type={showPassword ? 'text' : 'password'} value={filePassword} onChange={(e) => setFilePassword(e.target.value)}
                        className="glass-input" placeholder="Enter secret key..." />
                      <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="field-label">Algorithm</label>
                    <div className="input-wrapper">
                      <select value={fileAlgo} onChange={(e) => setFileAlgo(e.target.value)} className="glass-select">
                        <option>AES-GCM</option>
                        <option>ChaCha20-Poly1305</option>
                      </select>
                      <div className="select-chevron-icon"><ChevronDown /></div>
                    </div>
                  </div>
                </div>

                <button onClick={mode === 'encrypt' ? handleEncryptFile : handleDecryptFile} disabled={loading || !file || !filePassword.trim()}
                  className="w-full glass-button py-5 text-base font-bold uppercase tracking-widest bg-linear-to-r from-orange-500 to-yellow-500 border-none primary-glow disabled:opacity-50">
                  {loading ? 'Processing...' : (mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File')}
                </button>

                {fileError && (
                  <div className="glass-card bg-red-500/10 border-red-500/30 p-5">
                    <p className="text-red-400 text-sm font-semibold">{fileError}</p>
                  </div>
                )}

                {fileResult && (
                  <div className="glass-card p-6 flex justify-between items-center">
                    <span className="text-sm text-slate-400 font-mono truncate flex-1">
                      {mode === 'encrypt' ? `${file?.name}.enc` : formatDecryptedFilename(file?.name || 'file')}
                    </span>
                    <button onClick={() => downloadFile(fileResult, file?.name || 'file', mode === 'encrypt')} 
                      className="glass-button px-6 py-3 text-sm uppercase tracking-wider font-bold bg-linear-to-r from-blue-500 to-purple-500 border-none secondary-glow ml-4">
                      Download
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
