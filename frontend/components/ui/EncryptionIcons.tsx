'use client';

import { Lock, LockKeyholeOpen, ShieldAlert, Database } from 'lucide-react';

const VARIANTS = {
  encrypt: {
    color: '#818cf8',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    Icon: Lock,
    is3D: false,
  },
  decrypt: {
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    Icon: LockKeyholeOpen,
    is3D: false,
  },
  visualize: {
    color: '#06b6d4',
    background: 'rgba(6, 182, 212, 0.15)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    Icon: ShieldAlert,
    is3D: false,
  },
  database: {
    color: '#818cf8',
    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    Icon: Database,
    is3D: true,
  },
} as const;

type Variant = keyof typeof VARIANTS;

export default function EncryptionIcon({
  variant,
  size = 28,
  className = '',
}: {
  variant: Variant;
  size?: number;
  className?: string;
}) {
  const { color, background, border, Icon, is3D } = VARIANTS[variant];

  if (is3D) {
    return (
      <span
        className={`group/icon inline-flex shrink-0 items-center justify-center transition-all duration-[400ms] ${className}`}
        style={{
          width: size * 2 + 8,
          height: size * 2 + 8,
          borderRadius: '50%',
          background,
          border,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Icon
          size={size}
          strokeWidth={2}
          style={{ 
            color, 
            transition: 'all 0.4s ease',
          }}
          className="group-hover/icon:text-[#a5b4fc] group-hover/icon:-translate-y-0.5"
        />
      </span>
    );
  }

  return (
    <span
      className={`group/icon inline-flex shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${className}`}
      style={{ width: size * 2 + 8, height: size * 2 + 8, borderRadius: '50%', background, border }}
    >
      <Icon
        size={size}
        strokeWidth={2}
        style={{ color, transition: 'transform 0.3s ease' }}
        className="group-hover/icon:scale-125"
      />
    </span>
  );
}
