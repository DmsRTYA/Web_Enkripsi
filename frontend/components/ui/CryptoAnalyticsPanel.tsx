import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Activity, BarChart2, ShieldCheck, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CryptoAnalyticsPanelProps {
  loading: boolean;
  metrics?: {
    execution_time_ms?: number;
    entropy_ciphertext?: number;
    avalanche_percentage?: number;
    histogram_plaintext?: number[];
    histogram_ciphertext?: number[];
  } | null;
  isEncryption?: boolean;
}

export default function CryptoAnalyticsPanel({ loading, metrics, isEncryption = true }: CryptoAnalyticsPanelProps) {
  const [showHistogram, setShowHistogram] = useState(false);

  if (loading) {
    return (
      <div className="mt-6 p-6 rounded-xl glass-card border border-white/10 animate-pulse space-y-4">
        <div className="h-5 bg-white/10 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-white/5 rounded"></div>
          <div className="h-20 bg-white/5 rounded"></div>
          <div className="h-20 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const entropy = metrics.entropy_ciphertext ?? 0;
  const isEntropyGood = entropy > 7.9;

  const avalanche = metrics.avalanche_percentage;
  const isAvalancheGood = avalanche !== undefined && avalanche >= 45 && avalanche <= 55;

  // Prepare histogram data (0 to 255 bytes)
  const histPt = metrics.histogram_plaintext || [];
  const histCt = metrics.histogram_ciphertext || [];
  const chartData = Array.from({ length: 256 }, (_, i) => ({
    byte: i,
    Plaintext: histPt[i] || 0,
    Ciphertext: histCt[i] || 0,
  }));

  return (
    <div className="mt-6 p-6 rounded-xl glass-card border border-white/15 animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white tracking-wide">Panel Analisis Metrik Kriptografi</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
          Live Analysis
        </span>
      </div>

      {/* Grid Layout Kompak (3 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Waktu Komputasi */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-white text-xs uppercase tracking-wider">
            <span>Waktu Komputasi</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.execution_time_ms !== undefined ? metrics.execution_time_ms.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
        </div>

        {/* Card 2: Entropi Shannon */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-white text-xs uppercase tracking-wider">
            <span>Entropi Shannon</span>
            <BarChart2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${isEntropyGood ? 'text-emerald-400' : 'text-rose-400'}`}>
              {entropy.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-400">/ 8.0 max</span>
          </div>
          <p className="text-[10px] mt-1 text-slate-400 flex items-center gap-1">
            {isEntropyGood ? (
              <span className="text-emerald-400 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Keacakan Tinggi (Optimal)</span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> Di bawah standar (&lt;7.9)</span>
            )}
          </p>
        </div>

        {/* Card 3: Avalanche Effect (Encryption only) */}
        {isEncryption && avalanche !== undefined ? (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-white text-xs uppercase tracking-wider">
              <span>Avalanche Effect</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${isAvalancheGood ? 'text-emerald-400' : 'text-rose-400'}`}>
                {avalanche.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400">ideal ~50%</span>
            </div>
            <p className="text-[10px] mt-1 text-slate-400">
              {isAvalancheGood ? (
                <span className="text-emerald-400 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Efek Salju Sempurna</span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> Di luar kisaran 45-55%</span>
              )}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-white text-xs uppercase tracking-wider">
              <span>Mode Operasi</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3">
              <span className="text-lg font-bold font-mono text-white">Dekripsi Data</span>
            </div>
            <p className="text-[10px] mt-1 text-slate-400">Avalanche effect dihitung saat enkripsi</p>
          </div>
        )}
      </div>

      {/* Accordion untuk Histogram */}
      <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
        <button
          onClick={() => setShowHistogram(!showHistogram)}
          className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white"
        >
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-400" />
            Lihat Perbandingan Histogram Data (Plaintext vs Ciphertext)
          </span>
          {showHistogram ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistogram && (
          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-400">
              Histogram distribusi frekuensi nilai byte (0–255). Plaintext menunjukkan pola struktur asli (biru), sedangkan Ciphertext menunjukkan distribusi merata/acak (oranye).
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="byte" stroke="#64748b" tick={{ fontSize: 10 }} interval={31} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Plaintext" fill="#3b82f6" fillOpacity={0.6} />
                  <Bar dataKey="Ciphertext" fill="#f97316" fillOpacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
