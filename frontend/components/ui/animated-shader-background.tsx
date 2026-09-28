'use client';

export default function AnimatedShaderBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom_right,rgb(3,7,18)_0%,rgb(59,13,71)_50%,rgb(3,7,18)_100%)] animate-gradient-shift" />
  );
}