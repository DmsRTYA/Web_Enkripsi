'use client';

import { useState, useRef } from 'react';
import { FileUp, Plus } from 'lucide-react';

interface ChooseFileButtonProps {
  onFileSelect: (file: File) => void;
  className?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
}


export default function ChooseFileButton({
  onFileSelect,
  className = '',
  defaultTitle = 'Choose File',
  defaultSubtitle = 'Klik untuk memilih berkas',
}: ChooseFileButtonProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      setTitle(file.name);
      setSubtitle(`${(file.size / (1024 * 1024)).toFixed(2)} MB • File terpilih`);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      <label 
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex items-center gap-5 p-4 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/8 hover:border-indigo-400/40 hover:-translate-y-1 hover:shadow-[0_25px_50px_-10px_rgba(99,102,241,0.25),0_0_30px_rgba(99,102,241,0.15)] active:translate-y-0 active:scale-[0.98]"
      >
        {/* Highlight Line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-linear-to-r from-transparent via-white/25 to-transparent rounded-full" />

        {/* 3D Icon Container */}
        <div className="relative w-14 h-16 shrink-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] group-hover:rotate-2">
          {/* Back Sheet */}
          <div className="absolute inset-0 bg-linear-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-xl border border-indigo-900/50 -rotate-3 scale-95 opacity-60 transition-all duration-400 group-hover:rotate-[-7deg] group-hover:scale-95 group-hover:opacity-90 group-hover:border-indigo-400/40" />
          
          {/* Front Glass Sheet */}
          <div className="absolute inset-0 bg-linear-gradient-to-br from-[#1e1b4b]/70 to-[#0f172a]/90 rounded-xl border border-indigo-400/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.4)] transition-all duration-400 group-hover:border-indigo-300/60 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_12px_25px_rgba(99,102,241,0.3)]">
            <FileUp className="w-6 h-6 text-indigo-400 transition-all duration-400 group-hover:text-indigo-300 group-hover:-translate-y-0.5 drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]" />
            {/* Folded Corner */}
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-linear-gradient-to-bl from-white/20 to-indigo-400/40 rounded-bl-lg border-l border-b border-white/10" />
          </div>

          {/* Action Badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-linear-gradient-to-br from-indigo-500 to-indigo-700 border-2 border-[#080711] rounded-full flex items-center justify-center text-white shadow-[0_2px_8px_rgba(99,102,241,0.6)] transition-transform duration-400 group-hover:scale-110 group-hover:rotate-90">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-50 font-semibold text-sm transition-colors duration-300 group-hover:text-white">{title}</span>
          <span className="text-slate-500 text-xs transition-colors duration-300 group-hover:text-slate-400">{subtitle}</span>
        </div>
      </label>
    </div>
  );
}
