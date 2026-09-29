"use client";

import { useState, useEffect, useRef } from "react";
import EncryptionIcon from "./EncryptionIcons";

interface SkewCardProps {
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  iconVariant: "encrypt" | "decrypt" | "visualize" | "database";
  onClick: () => void;
  children?: React.ReactNode;
}

export default function SkewCard({
  title,
  description,
  gradientFrom,
  gradientTo,
  iconVariant,
  onClick,
  children,
}: SkewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      card.style.transform =
        "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const gradientStyle = `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`;

  return (
    <div
      ref={cardRef}
      className="relative cursor-pointer select-none"
      style={{ width: "320px", height: "300px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Floating Glass Blobs */}
      <div
        className="absolute transition-all duration-500 ease-out pointer-events-none"
        style={{
          top: isHovered ? "-50px" : "0",
          left: isHovered ? "50px" : "0",
          width: isHovered ? "100px" : "0",
          height: isHovered ? "100px" : "0",
          borderRadius: "8px",
          opacity: isHovered ? 1 : 0,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
          animation: "floatBlob 3s ease-in-out infinite",
        }}
      />
      <div
        className="absolute transition-all duration-500 ease-out pointer-events-none"
        style={{
          bottom: isHovered ? "-50px" : "0",
          right: isHovered ? "50px" : "0",
          width: isHovered ? "100px" : "0",
          height: isHovered ? "100px" : "0",
          borderRadius: "8px",
          opacity: isHovered ? 1 : 0,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
          animation: "floatBlob 3s ease-in-out infinite -1.5s",
        }}
      />

      {/* Glass Content Box */}
      <div
        className="relative z-20 transition-all duration-500 ease-out"
        style={{
          left: isHovered ? "-25px" : "0",
          padding: isHovered ? "60px 40px" : "20px 40px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
          color: "#fff",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="flex items-center gap-4 mb-6">
          <EncryptionIcon variant={iconVariant} />
          <h2 className="text-xl font-bold uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <p
          className="text-base leading-relaxed mb-6"
          style={{ color: "rgba(255, 255, 255, 0.8)" }}
        >
          {description}
        </p>
        {children}
      </div>

      <style jsx global>{`
        @keyframes floatBlob {
          0%,
          100% {
            transform: translateY(10px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
