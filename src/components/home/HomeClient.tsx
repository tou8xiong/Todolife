"use client";
import AddTasks from "@/components/tasks/AddTasks";
import Footer from "@/components/layout/Footer";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState, useCallback } from "react";

function FloatingDots() {
  const getDotStyle = (i: number) => {
    const seeds = [7, 13, 17, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113];
    const seed = seeds[i % seeds.length];
    return {
      size: (seed % 8) + 3,
      left: (seed * 37) % 100,
      delay: (seed * 13) % 8,
      duration: (seed % 5) + 5,
    };
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 25 }, (_, i) => {
        const dot = getDotStyle(i);
        return (
          <div
            key={i}
            className="absolute rounded-full animate-float-dot"
            style={{
              width: dot.size,
              height: dot.size,
              left: `${dot.left}%`,
              bottom: "-20px",
              background: `linear-gradient(135deg, #93c5fd, #3b82f6, #fbbf24)`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
              boxShadow: `0 0 ${dot.size * 2}px rgba(59, 130, 246, 0.4), 0 0 ${dot.size * 4}px rgba(251, 191, 36, 0.2)`,
            }}
          />
        );
      })}
    </div>
  );
}

function MouseFollower() {
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPositions(prev => {
      const newPos = { x: e.clientX, y: e.clientY };
      const updated = [newPos, ...prev].slice(0, 40);
      return updated;
    });
    if (!isVisible) setIsVisible(true);
  }, [isVisible]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  if (!isDesktop || !isVisible || positions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {positions.map((pos, i) => {
        const size = Math.max(2, 10 - i * 0.25);
        const opacity = Math.max(0.1, 0.8 - i * 0.02);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: pos.x - size / 2,
              top: pos.y - size / 2,
              background: `radial-gradient(circle, rgba(147, 197, 253, ${opacity}), rgba(251, 191, 36, ${opacity * 0.6}))`,
              boxShadow: `0 0 ${size * 2}px rgba(59, 130, 246, ${opacity * 0.5}), 0 0 ${size * 3}px rgba(251, 191, 36, ${opacity * 0.3})`,
              transition: 'left 0.05s ease-out, top 0.05s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}

function WaveText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`inline-flex ${className}`}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="animate-wave"
          style={{ animationDelay: `${i * 0.08}s`, display: 'inline-block' }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export default function HomeClient() {
  const { user } = useAppContext();
  const username = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 sm:w-full w-full flex flex-col justify-center overflow-x-hidden text-white relative">
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(-1deg); }
          50% { transform: translateY(-3px) rotate(0.5deg); }
          75% { transform: translateY(-8px) rotate(-0.5deg); }
        }
        @keyframes floatDot {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 0.6; }
          50% { opacity: 0.4; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(1); opacity: 0; }
        }
        @keyframes trail {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(0.2); opacity: 0; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(147, 197, 253, 0.5)); }
          50% { filter: drop-shadow(0 0 25px rgba(251, 191, 36, 0.7)); }
        }
        @keyframes seaWave {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-wave {
          display: inline-block;
          animation: wave 2.5s ease-in-out infinite;
        }
        .animate-wave-text {
          display: inline-block;
          animation: seaWave 3s ease-in-out infinite;
        }
        .animate-float-dot {
          animation: floatDot linear infinite;
        }
        .animate-trail {
          animation: trail 0.6s ease-out forwards;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientMove 4s ease infinite;
        }
        .animate-glow {
          animation: glow 2.5s ease-in-out infinite;
        }
      `}</style>

      {mounted && <MouseFollower />}
      {mounted && <FloatingDots />}

      <div className="min-h-screen sm:py-4 w-full flex flex-col lg:flex-row justify-center gap-2 relative z-10">
        <div className="w-full max-w-xl flex flex-col gap-2">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-center">
            <p className="text-2xl mb-5">
              Hi{" "}
              <span className="text-5xl text-blue-300 animate-glow">
                {mounted ? <WaveText text={username} /> : username}
              </span>
            </p>
            <span className="text-3xl sm:text-5xl inline-block animate-wave-text">
              <WaveText text="Welcome To TODOLIFE" className="text-blue-400" />
            </span>
          </h1>
          <h1 className="font-serif text-center text-base sm:text-lg text-gray-200 mt-4">
            <span className="animate-wave-text">
              <WaveText text="TODOLIFE will make your tasks done easier" className="text-blue-300" />
            </span>
          </h1>
        </div>
        <AddTasks />
      </div>
      <Footer />
    </div>
  );
}
