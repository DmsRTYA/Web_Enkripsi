'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronDown, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundGlobal from '@/components/ui/BackgroundGlobal';
import SkewCard from '@/components/ui/SkewCard';
import BackButton from '@/components/ui/BackButton';
import ChooseFileButton from '@/components/ui/ChooseFileButton';
import ImageEncryptionVisualizer from '@/components/ui/ImageEncryptionVisualizer';
import CryptoAnalyticsPanel from '@/components/ui/CryptoAnalyticsPanel';
import { useTextEncryptionHistory, saveTextEncryptionHistory } from '@/hooks/useTextEncryptionHistory';
import { useFileEncryptionHistory, saveFileEncryptionHistory } from '@/hooks/useFileEncryptionHistory';
import { encryptPassword } from '@/lib/passwordEncryption';
import { validatePassword } from '@/lib/passwordValidation';

type Mode = 'menu' | 'encrypt' | 'decrypt' | 'visualize' | 'history';
type ContentType = 'text' | 'file';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [mode, setMode] = useState<Mode>('menu');
  const [contentType, setContentType] = useState<ContentType>('text');
  const [loading, setLoading] = useState(false);
  const [showSecondRow, setShowSecondRow] = useState(false);

  const [textInput, setTextInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [algo, setAlgo] = useState('AES-GCM');
  const [textResult, setTextResult] = useState('');
  const [textError, setTextError] = useState('');
  const [textFailedAttempts, setTextFailedAttempts] = useState(0);
  const [textLockout, setTextLockout] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState('');
  const [fileAlgo, setFileAlgo] = useState('AES-GCM');
  const [fileResult, setFileResult] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileFailedAttempts, setFileFailedAttempts] = useState(0);
  const [fileLockout, setFileLockout] = useState(0);

  const [metrics, setMetrics] = useState<{
    execution_time_ms?: number;
    entropy_ciphertext?: number;
    avalanche_percentage?: number;
    histogram_plaintext?: number[];
    histogram_ciphertext?: number[];
  } | null>(null);

  // History mode state
  const [historyType, setHistoryType] = useState<ContentType>('text');
  
  // Instance state management
  const textHook = useTextEncryptionHistory();
  const fileHook = useFileEncryptionHistory();

  const { data: textHistory, loading: textHistoryLoading, mutate: mutateText } = textHook;
  const { data: fileHistory, loading: fileHistoryLoading, mutate: mutateFile } = fileHook;

  // Initial fetch on mount
  useEffect(() => {
    mutateText();
    mutateFile();
  }, [mutateText, mutateFile]);

  // Refetch on entering history mode
  useEffect(() => {
    if (mode === 'history') {
      mutateText();
      mutateFile();
    }
  }, [mode, mutateText, mutateFile]);

  useEffect(() => {
    if (mode !== 'menu') return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowSecondRow(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode]);

  // Lockout timer effects
  useEffect(() => {
    if (textLockout > 0) {
      const timer = setInterval(() => {
        setTextLockout(prev => {
          if (prev <= 1) {
            setTextFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [textLockout]);

  useEffect(() => {
    if (fileLockout > 0) {
      const timer = setInterval(() => {
        setFileLockout(prev => {
          if (prev <= 1) {
            setFileFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [fileLockout]);


  const resetState = () => {
    setTextInput(''); setPassword(''); setTextResult(''); setTextError('');
    setFile(null); setFilePassword(''); setFileResult(''); setFileError('');
    setMetrics(null);
  };

  const handleEncryptText = async () => {
    if (!textInput.trim() || !password.trim()) { setTextError('Field wajib diisi'); return; }
    if (!validatePassword(password)) { setTextError('Password minimal 6 karakter dan mengandung huruf + angka'); return; }
    if (textLockout > 0) { setTextError(`Tersedia ${textLockout} detik lagi`); return; }
    setLoading(true); setTextError(''); setTextResult(''); setMetrics(null);
    try {
      const response = await fetch(`${API_BASE}/api/enkripsi/teks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: textInput, password_kripto: password, algo: algo }),
      });
      if (!response.ok) {
        const error = await response.json();
        setTextError(error.detail || 'Enkripsi gagal');
        const attempts = textFailedAttempts + 1;
        setTextFailedAttempts(attempts);
        if (attempts >= 3) { setTextLockout(15); setTextFailedAttempts(0); }
      }
      else {
        const data = await response.json();
        setTextResult(data.ciphertext);
        setTextFailedAttempts(0);
        setMetrics({
          execution_time_ms: data.execution_time_ms,
          entropy_ciphertext: data.entropy_ciphertext,
          avalanche_percentage: data.avalanche_percentage,
          histogram_plaintext: data.histogram_plaintext,
          histogram_ciphertext: data.histogram_ciphertext,
        });

        // Encrypt password before sending to database
        const encryptedPassword = await encryptPassword(password);
        const { error: saveError } = await saveTextEncryptionHistory(
          data.ciphertext,
          encryptedPassword,
          algo
        );
        if (!saveError) mutateText();
      }
    } catch (err) { setTextError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const handleDecryptText = async () => {
    if (!textInput.trim() || !password.trim()) { setTextError('Field wajib diisi'); return; }
    // Password validation removed for decryption per security requirement
    if (textLockout > 0) { setTextError(`Tersedia ${textLockout} detik lagi`); return; }
    setLoading(true); setTextError(''); setTextResult(''); setMetrics(null);
    try {
      const response = await fetch(`${API_BASE}/api/dekripsi/teks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: textInput, password_kripto: password, algo: algo }),
      });
      if (!response.ok) {
        const error = await response.json();
        setTextError(error.detail || 'Dekripsi gagal');
        const attempts = textFailedAttempts + 1;
        setTextFailedAttempts(attempts);
        if (attempts >= 3) { setTextLockout(15); setTextFailedAttempts(0); }
      }
      else {
        const data = await response.json();
        setTextResult(data.plaintext);
        setTextFailedAttempts(0);
        setMetrics({
          execution_time_ms: data.execution_time_ms,
          entropy_ciphertext: data.entropy_ciphertext,
          histogram_plaintext: data.histogram_plaintext,
          histogram_ciphertext: data.histogram_ciphertext,
        });

        // Save to Supabase
        const encryptedPassword = await encryptPassword(password);
        const { error: saveError } = await saveTextEncryptionHistory(
          textInput, // original ciphertext
          encryptedPassword,
          algo
        );
        if (!saveError) mutateText();
      }
    } catch (err) { setTextError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const handleEncryptFile = async () => {
    if (!file || !filePassword.trim()) { setFileError('Field wajib diisi'); return; }
    if (!validatePassword(filePassword)) { setFileError('Password minimal 6 karakter dan mengandung huruf + angka'); return; }
    if (fileLockout > 0) { setFileError(`Tersedia ${fileLockout} detik lagi`); return; }
    setLoading(true); setFileError(''); setFileResult(''); setMetrics(null);
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('password_kripto', filePassword); formData.append('algo', fileAlgo);
      const response = await fetch(`${API_BASE}/api/enkripsi/file`, { method: 'POST', body: formData });
      if (!response.ok) {
        const error = await response.json();
        setFileError(error.detail || 'Enkripsi file gagal');
        const attempts = fileFailedAttempts + 1;
        setFileFailedAttempts(attempts);
        if (attempts >= 3) { setFileLockout(15); setFileFailedAttempts(0); }
      }
      else {
        const data = await response.json();
        setFileResult(data.ciphertext);
        setFileFailedAttempts(0);
        setMetrics({
          execution_time_ms: data.execution_time_ms,
          entropy_ciphertext: data.entropy_ciphertext,
          avalanche_percentage: data.avalanche_percentage,
          histogram_plaintext: data.histogram_plaintext,
          histogram_ciphertext: data.histogram_ciphertext,
        });

        // Save to Supabase
        const encryptedPassword = await encryptPassword(filePassword);
        const { error: saveError } = await saveFileEncryptionHistory(
          file.name,
          encryptedPassword,
          fileAlgo,
          `${file.name}.enc`,
          file.size
        );
        if (!saveError) mutateFile();
      }
    } catch (err) { setFileError(err instanceof Error ? err.message : 'Koneksi gagal'); } finally { setLoading(false); }
  };

  const handleDecryptFile = async () => {
    if (!file || !filePassword.trim()) { setFileError('Field wajib diisi'); return; }
    // Password validation removed for decryption per security requirement
    if (fileLockout > 0) { setFileError(`Tersedia ${fileLockout} detik lagi`); return; }
    setLoading(true); setFileError(''); setFileResult(''); setMetrics(null);
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('password_kripto', filePassword); formData.append('algo', fileAlgo);
      const response = await fetch(`${API_BASE}/api/dekripsi/file`, { method: 'POST', body: formData });
      if (!response.ok) {
        const error = await response.json();
        setFileError(error.detail || 'Dekripsi file gagal');
        const attempts = fileFailedAttempts + 1;
        setFileFailedAttempts(attempts);
        if (attempts >= 3) { setFileLockout(15); setFileFailedAttempts(0); }
      }
      else {
        const data = await response.json();
        setFileResult(data.file_asli_b64);
        setFileFailedAttempts(0);
        setMetrics({
          execution_time_ms: data.execution_time_ms,
          entropy_ciphertext: data.entropy_ciphertext,
          histogram_plaintext: data.histogram_plaintext,
          histogram_ciphertext: data.histogram_ciphertext,
        });

        // Save to Supabase
        const encryptedPassword = await encryptPassword(filePassword);
        const { error: saveError } = await saveFileEncryptionHistory(
          file.name,
          encryptedPassword,
          fileAlgo,
          `${file.name}.enc`,
          file.size
        );
        if (!saveError) mutateFile();
      }
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

<main className={`mx-auto pt-32 pb-64 px-6 transition-all duration-300 ${mode === 'menu' ? 'max-w-4xl' : mode === 'visualize' ? 'max-w-5xl' : 'max-w-3xl'}`}>
        {mode === 'menu' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-5xl font-bold tracking-tight text-white">Secure Encryption</h2>
              <p className="text-slate-400 text-lg">Military-grade cryptography at your fingertips</p>
            </div>

            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[62.72px] gap-y-[83.3px]">
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

                <AnimatePresence>
                  {showSecondRow && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <SkewCard
                          title="Visualize"
                          description="See why ECB mode is dangerous"
                          gradientFrom="#00f2fe"
                          gradientTo="#4facfe"
                          iconVariant="visualize"
                          onClick={() => { setMode('visualize'); resetState(); }}
                        >
                          <button 
                            onClick={() => { setMode('visualize'); resetState(); }}
                            className="mt-auto w-full py-3 bg-white text-black font-bold rounded transition-all hover:bg-yellow-300"
                          >
                            View Vulnerability
                          </button>
                        </SkewCard>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                      >
                        <SkewCard
                          title="Data Tersimpan"
                          description="View encrypted text & file history"
                          gradientFrom="#10b981"
                          gradientTo="#059669"
                          iconVariant="database"
                          onClick={() => { setMode('history'); setHistoryType('text'); }}
                        >
                          <button 
                            onClick={() => { setMode('history'); setHistoryType('text'); }}
                            className="mt-auto w-full py-3 bg-white text-black font-bold rounded transition-all hover:bg-yellow-300"
                          >
                            View History
                          </button>
                        </SkewCard>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {mode === 'visualize' && (
          <ImageEncryptionVisualizer onBack={() => { setMode('menu'); resetState(); }} />
        )}

        {mode === 'history' && (
          <div className="glass-card p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between mb-10">
              <BackButton onClick={() => { setMode('menu'); resetState(); }} />
              <h2 className="text-2xl font-bold uppercase tracking-widest">DATA TERSIMPAN</h2>
              <div className="w-24" />
            </div>

            <div className="flex gap-3 mb-8 glass-nav p-2 rounded-full">
              {(['text', 'file'] as ContentType[]).map((type) => (
                <button key={type}
                  onClick={() => setHistoryType(type)}
                  className={`flex-1 rounded-full py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                    historyType === type
                      ? 'bg-linear-to-r from-orange-500 to-yellow-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {type}
                </button>
              ))}
            </div>

            {historyType === 'text' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wider">Teks</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wider">Password</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wider">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {textHistoryLoading ? (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
                    ) : textHistory.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">Belum ada data</td></tr>
                    ) : (
                      textHistory.map((row) => (
                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs truncate max-w-[200px]">{row.ciphertext}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs truncate max-w-[150px]">{row.password_ciphertext}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wider">Nama File</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wider">Password</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-semibold uppercase text-xs tracking-wider">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileHistoryLoading ? (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">Loading...</td></tr>
                    ) : fileHistory.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">Belum ada data</td></tr>
                    ) : (
                      fileHistory.map((row) => (
                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs truncate max-w-[200px]">{row.original_filename}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-xs truncate max-w-[150px]">{row.password_ciphertext}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{new Date(row.created_at).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
                      ? 'bg-linear-to-r from-orange-500 to-yellow-500 text-white' 
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
                        className="glass-input" placeholder="Enter secret key..." disabled={textLockout > 0} />
                      {textLockout > 0 && <span className="absolute right-12 top-1/2 -translate-y-1/2 text-red-500 font-bold flex items-center gap-1"><Clock size={16}/>{textLockout}s</span>}
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
                  className="w-full glass-button py-5 text-base font-bold uppercase tracking-widest bg-linear-to-r from-orange-500 to-yellow-500 border-none disabled:opacity-50 disabled:cursor-not-allowed">
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

                {/* Analytics Panel (Loading skeleton or results) */}
                {(loading || metrics) && (
                  <CryptoAnalyticsPanel loading={loading} metrics={metrics} isEncryption={mode === 'encrypt'} />
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
                        className="glass-input" placeholder="Enter secret key..." disabled={fileLockout > 0} />
                      {fileLockout > 0 && <span className="absolute right-12 top-1/2 -translate-y-1/2 text-red-500 font-bold flex items-center gap-1"><Clock size={16}/>{fileLockout}s</span>}
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
                  className="w-full glass-button py-5 text-base font-bold uppercase tracking-widest bg-linear-to-r from-orange-500 to-yellow-500 border-none disabled:opacity-50">
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

                {/* Analytics Panel (Loading skeleton or results) */}
                {(loading || metrics) && (
                  <CryptoAnalyticsPanel loading={loading} metrics={metrics} isEncryption={mode === 'encrypt'} />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
