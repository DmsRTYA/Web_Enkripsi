'use client';

import { useEffect, useRef } from 'react';

export default function BackgroundGlobal() {
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const centerGradientRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  const mouseRef = useRef({ x: 0, y: 0, px: 50, py: 50 });
  const rafRef = useRef(0);

  useEffect(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    mouseRef.current = { x: centerX, y: centerY, px: 50, py: 50 };

    const handleMouseMove = (e: MouseEvent) => {
      const px = (e.clientX / window.innerWidth) * 100;
      const py = (e.clientY / window.innerHeight) * 100;
      mouseRef.current = {
        x: e.clientX - centerX,
        y: e.clientY - centerY,
        px,
        py,
      };
    };

    const handleResize = () => {
      mouseRef.current = {
        x: 0,
        y: 0,
        px: 50,
        py: 50,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const getQuadrantColor = (px: number, py: number) => {
      // px, py are 0-100 (screen percentage)
      const isTop = py < 50;
      const isLeft = px < 50;

      if (isTop && isLeft) {
        // Top-Left: Cool Violet → Cyan
        return { color1: '#7928ca', color2: '#00d0ff' };
      } else if (isTop && !isLeft) {
        // Top-Right: Hot Magenta → Yellow
        return { color1: '#ff007f', color2: '#ffbc00' };
      } else if (!isTop && isLeft) {
        // Bottom-Left: Mint → Cyan
        return { color1: '#00f5d4', color2: '#00f2fe' };
      } else {
        // Bottom-Right: Warm Amber → Hot Pink
        return { color1: '#ffbc00', color2: '#ff0058' };
      }
    };

    const animate = () => {
      const mouse = mouseRef.current;
      const pos = posRef.current;

      // Orb 1: follows mouse (0.06 strength)
      pos[0].x += (mouse.x * 0.06 - pos[0].x) * 0.04;
      pos[0].y += (mouse.y * 0.06 - pos[0].y) * 0.04;

      // Orb 2: follows opposite mouse (-0.05 strength)
      pos[1].x += (-mouse.x * 0.05 - pos[1].x) * 0.04;
      pos[1].y += (-mouse.y * 0.05 - pos[1].y) * 0.04;

      // Orb 3: follows mouse (0.04 strength)
      pos[2].x += (mouse.x * 0.04 - pos[2].x) * 0.04;
      pos[2].y += (mouse.y * 0.04 - pos[2].y) * 0.04;

      // Orb 4: follows opposite X, same Y (-0.07, 0.07)
      pos[3].x += (-mouse.x * 0.07 - pos[3].x) * 0.04;
      pos[3].y += (mouse.y * 0.07 - pos[3].y) * 0.04;

      wrapRefs.current.forEach((wrap, i) => {
        if (wrap) {
          wrap.style.transform = `translate3d(${pos[i].x}px, ${pos[i].y}px, 0)`;
        }
      });

      // Update center gradient following cursor with quadrant color
      if (centerGradientRef.current) {
        const { color1, color2 } = getQuadrantColor(mouse.px, mouse.py);
        centerGradientRef.current.style.setProperty('--mx', `${mouse.px}%`);
        centerGradientRef.current.style.setProperty('--my', `${mouse.py}%`);
        centerGradientRef.current.style.setProperty('--c1', color1);
        centerGradientRef.current.style.setProperty('--c2', color2);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: '#080711' }}>
      {/* Cursor-following Center Gradient (Quadrant Color Shift) */}
      <div
        ref={(el) => { centerGradientRef.current = el; }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle 600px at var(--mx, 50%) var(--my, 50%), var(--c1, #7928ca) 0%, var(--c2, #00d0ff) 40%, transparent 70%)',
          opacity: 0.03,
          transition: 'background 0.6s ease',
          zIndex: 1,
        }}
      />

      {/* Orb Wrappers */}
      <div
        ref={(el) => { wrapRefs.current[0] = el; }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '420px',
          height: '420px',
          top: '10%',
          left: '15%',
          willChange: 'transform',
          zIndex: 2,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #7928ca 0%, rgba(121, 40, 202, 0) 70%)',
            opacity: 0.20,
            animation: 'floatLoop1 12s ease-in-out infinite alternate, pulseGlow 4s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>

      <div
        ref={(el) => { wrapRefs.current[1] = el; }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '520px',
          height: '520px',
          bottom: '5%',
          right: '12%',
          willChange: 'transform',
          zIndex: 2,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #00f2fe 0%, rgba(0, 242, 254, 0) 70%)',
            opacity: 0.18,
            animation: 'floatLoop2 16s ease-in-out infinite alternate, pulseGlow 5s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>

      <div
        ref={(el) => { wrapRefs.current[2] = el; }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '380px',
          height: '380px',
          top: '40%',
          left: '40%',
          willChange: 'transform',
          zIndex: 2,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #00f5d4 0%, rgba(0, 245, 212, 0) 70%)',
            opacity: 0.15,
            animation: 'floatLoop3 14s ease-in-out infinite alternate, pulseGlow 4.5s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>

      <div
        ref={(el) => { wrapRefs.current[3] = el; }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '340px',
          height: '340px',
          top: '15%',
          right: '20%',
          willChange: 'transform',
          zIndex: 2,
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #ff007f 0%, rgba(255, 0, 127, 0) 70%)',
            opacity: 0.14,
            animation: 'floatLoop1 11s ease-in-out infinite alternate-reverse, pulseGlow 5.5s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Glass Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(13, 11, 26, 0.05)',
          backdropFilter: 'blur(55px)',
          WebkitBackdropFilter: 'blur(55px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          zIndex: 10,
        }}
      />

      {/* Noise Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          opacity: 0.005,
          mixBlendMode: 'overlay',
          zIndex: 11,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(8, 7, 17, 0.6) 100%)',
          zIndex: 12,
        }}
      />

      <style jsx global>{`
        @keyframes floatLoop1 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(60px, -40px) scale(1.15);
          }
          100% {
            transform: translate(-40px, 50px) scale(0.9);
          }
        }

        @keyframes floatLoop2 {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-70px, 30px) scale(0.85);
          }
          100% {
            transform: translate(50px, -60px) scale(1.1);
          }
        }

        @keyframes floatLoop3 {
          0% {
            transform: translate(0, 0) scale(0.9);
          }
          50% {
            transform: translate(-50px, -50px) scale(1.2);
          }
          100% {
            transform: translate(40px, 40px) scale(1);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.30;
          }
        }
      `}</style>
    </div>
  );
}