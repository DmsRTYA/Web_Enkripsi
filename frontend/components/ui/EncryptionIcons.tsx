'use client';

import { Lock, LockKeyholeOpen } from 'lucide-react';

const VARIANTS = {
  encrypt: {
    color: '#818cf8',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    Icon: Lock,
  },
  decrypt: {
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    Icon: LockKeyholeOpen,
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
  const { color, background, border, Icon } = VARIANTS[variant];

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
