'use client';

import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

export default function BackButton({ onClick, className = '' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-slate-300 text-sm font-medium transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 hover:border-indigo-400/40 hover:text-white hover:-translate-y-0.5 hover:shadow-[0_8px_25px_-4px_rgba(99,102,241,0.3),0_0_15px_rgba(99,102,241,0.15)] active:translate-y-0 active:scale-95 ${className}`}
    >
      <ChevronLeft 
        size={18} 
        className="text-slate-400 transition-all duration-350 group-hover:-translate-x-1 group-hover:text-indigo-400" 
      />
      <span>Kembali</span>
    </button>
  );
}
