"use client";
import React, { useState, useRef, useEffect } from "react";
import { CloudRain, TreePine, Music, Maximize2, Minimize2, Play, Pause, RotateCcw, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

const PRESET_VIDEOS = [
  { id: "jfKfPfyJRdk", name: "Lofi Girl", icon: Music, color: "text-green-400", hover: "hover:bg-green-900/30" },
  { id: "mPZkdNFkNps", name: "Rainy Tokyo", icon: CloudRain, color: "text-blue-400", hover: "hover:bg-blue-900/30" },
  { id: "4xDzrJKXOOY", name: "Synthwave", icon: Zap, color: "text-purple-400", hover: "hover:bg-purple-900/30" },
];

export default function TimerSettings() {
  const [centis, setCentis] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [iframeSrc, setIframeSrc] = useState(`https://www.youtube.com/embed/${PRESET_VIDEOS[0].id}?autoplay=0`);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeLabel, setActiveLabel] = useState(PRESET_VIDEOS[0].name);

  const start = () => {
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(() => {
      setCentis((c) => c + 1);
    }, 10);
    setRunning(true);
  };

  const stop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  const reset = () => {
    stop();
    setCentis(0);
  };

  const handleFinish = () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please log in to save your session");
      return;
    }

    const session = {
      id: Date.now(),
      duration: centis,
      timestamp: new Date().toISOString(),
      videoName: activeLabel,
    };

    const key = `study_sessions_${user.email}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...existing, session]));

    toast.success("Study session saved! Great work!");
    reset();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const hours = Math.floor(centis / 360000);
  const minutes = Math.floor((centis % 360000) / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const cs = centis % 100;

  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  const formattedplushour = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;

  return (
    <div className="relative w-full min-h-screen p-4 sm:p-8 flex flex-col items-center bg-linear-to-b from-gray-900 to-gray-600">

      {/* Focus Mode Toggle */}
      <button
        onClick={() => setIsFocusMode(!isFocusMode)}
        className="absolute top-6 right-6 p-3 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 hover:scale-110 transition-all z-[210]"
        title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
      >
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-5xl w-full flex flex-col gap-8 mt-6 pb-10">

        {/* Header Section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-6xl font-bold font-serif text-white tracking-tight">
            {isFocusMode ? "🎯 Focusing..." : "⏱ Study Hub"}
          </h1>
          <p className="text-gray-300 text-lg italic">
            "The secret of getting ahead is getting started."
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Timer Card - Takes 2 columns */}
          <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-700 flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              Stopwatch
            </h2>
            
            {/* Timer Display */}
            <div className="relative mb-8">
              <div className="text-6xl sm:text-7xl font-mono font-bold text-amber-400 tracking-tighter">
                {hours > 0 ? formattedplushour : formatted}
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {!running ? (
                <button
                  onClick={start}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all hover:shadow-lg hover:shadow-green-500/30 active:scale-95"
                >
                  <Play size={20} fill="currentColor" /> Start
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold transition-all hover:shadow-lg hover:shadow-amber-500/30 active:scale-95"
                >
                  <Pause size={20} fill="currentColor" /> Pause
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-2xl font-bold transition-all active:scale-95 border border-gray-600"
              >
                <RotateCcw size={20} /> Reset
              </button>
            </div>

            {centis > 100 && (
              <button
                onClick={handleFinish}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-2xl font-bold transition-all hover:shadow-lg hover:shadow-sky-500/30 active:scale-95"
              >
                <CheckCircle2 size={20} /> Finish Session
              </button>
            )}

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 w-full">
              <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Session</p>
                <p className="text-white font-bold text-lg">{activeLabel}</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Status</p>
                <p className={`font-bold text-lg ${running ? "text-green-400" : "text-gray-400"}`}>
                  {running ? "Active" : "Idle"}
                </p>
              </div>
            </div>
          </div>

          {/* Music & Ambience Card - Takes 3 columns */}
          <div className="lg:col-span-3 bg-gray-800/80 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-gray-700 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music size={20} className="text-amber-400" /> Lo-fi Radio
            </h2>

            {/* YouTube Embed */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner ring-2 ring-gray-700">
              <iframe
                key={iframeSrc}
                width="100%"
                height="100%"
                src={iframeSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-2xl"
              />
            </div>

            {/* Preset Channel Buttons */}
            <div className="flex flex-wrap gap-3">
              {PRESET_VIDEOS.map((video) => {
                const Icon = video.icon;
                const isActive = iframeSrc.includes(video.id);
                return (
                  <button
                    key={video.id}
                    onClick={() => {
                      setIframeSrc(`https://www.youtube.com/embed/${video.id}?autoplay=0`);
                      setActiveLabel(video.name);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm
                      ${isActive 
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" 
                        : `bg-gray-700/60 ${video.color} ${video.hover} border border-gray-600 hover:border-gray-500`
                      }`}
                  >
                    <Icon size={16} />
                    {video.name}
                  </button>
                );
              })}
            </div>

            {/* Ambience Quick Toggle */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-sm">Quick Ambience:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIframeSrc(`https://www.youtube.com/embed/mPZkdNFkNps?autoplay=0`);
                    setActiveLabel("Rainy Tokyo");
                  }}
                  className="p-2 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800 transition-all"
                  title="Rainy Ambience"
                >
                  <CloudRain size={18} />
                </button>
                <button
                  onClick={() => {
                    setIframeSrc(`https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0`);
                    setActiveLabel("Lofi Girl");
                  }}
                  className="p-2 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800 transition-all"
                  title="Nature Sounds"
                >
                  <TreePine size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tips */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
          <p className="text-center text-gray-300 text-sm">
            💡 <span className="text-amber-400 font-medium">Tip:</span> Use the Pomodoro timer on your Dashboard for focused 25-minute work sessions!
          </p>
        </div>
      </div>
    </div>
  );
}
