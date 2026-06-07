"use client";
import AddTasks from "@/components/tasks/AddTasks";
import Footer from "@/components/layout/Footer";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";

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

export default function HomeClient() {
  const { user } = useAppContext();
  const username = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 sm:w-full w-full flex flex-col justify-center overflow-x-hidden text-slate-900 dark:text-white relative transition-colors">
      <style>{`
        @keyframes floatDot {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 0.6; }
          50% { opacity: 0.4; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(1); opacity: 0; }
        }
        .animate-float-dot {
          animation: floatDot linear infinite;
        }
      `}</style>

      {mounted && <FloatingDots />}

      <div className="min-h-screen sm:py-4 w-full flex flex-col lg:flex-row justify-center gap-2 relative z-10">
        <div className="w-full max-w-xl flex flex-col gap-2 px-4 sm:px-6 animate-fade-in-up">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-center text-slate-900 dark:text-white break-words">
            <p className="text-xl sm:text-2xl mb-5">
              Hi{" "}
              <span className="text-3xl sm:text-5xl text-slate-900 dark:text-white break-words">
                {username}
              </span>
            </p>
            <span className="text-2xl sm:text-5xl inline-block text-slate-900 dark:text-white break-words">
              Welcome To TODOLIFE
            </span>
          </h1>
          <h1 className="font-serif text-center text-sm sm:text-lg text-slate-700 dark:text-white mt-4 break-words">
            <span className="text-slate-700 dark:text-white">
              TODOLIFE will make your tasks done easier
            </span>
          </h1>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <AddTasks />
        </div>
      </div>
      <Footer />
    </div>
  );
}
