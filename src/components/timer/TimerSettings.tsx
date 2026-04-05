"use client";
import React, { useState, useRef, useEffect } from "react";
import { Coffee, CloudRain, TreePine, Music, Maximize2, Minimize2, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

const LOFI_VIDEOS = [
  { id: "jfKfPfyJRdk", name: "Lofi Girl - Chilled Beats" },
  { id: "bo_uzXpUStY", name: "Coffee Shop Ambience" },
  { id: "mPZkdNFkNps", name: "Rainy Night in Tokyo" },
  { id: "4xDzrJKXOOY", name: "Synthwave Radio" },
];

export default function TimerSettings() {
  const [centis, setCentis] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState(LOFI_VIDEOS[0].id);
  const [isFocusMode, setIsFocusMode] = useState(false);

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
      duration: centis, // in centiseconds
      timestamp: new Date().toISOString(),
      videoName: LOFI_VIDEOS.find(v => v.id === activeVideo)?.name || "Lofi Beats"
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
    <div className={`relative transition-all duration-500 w-full min-h-screen p-4 flex flex-col items-center ${isFocusMode ? "bg-white dark:bg-gray-950 overflow-y-auto" : "bg-transparent"}`}>

      {/* Focus Mode Toggle */}
      <button
        onClick={() => setIsFocusMode(!isFocusMode)}
        className={`absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all z-[210] ${isFocusMode
          ? "bg-amber-500 text-white hover:bg-amber-600 scale-110"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:scale-110"
          }`}
        title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
      >
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-4xl w-full flex flex-col gap-8 mt-10 pb-10">

        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className={`text-4xl sm:text-5xl font-bold font-serif transition-colors ${isFocusMode ? "text-white" : "text-black"}`}>
            {isFocusMode ? "Focusing..." : "Study Hub"}
          </h1>
          <p className={`font-medium italic transition-colors ${isFocusMode ? "text-white/80" : "text-slate-800"}`}>
            "The secret of getting ahead is getting started."
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Timer Card */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-amber-100 dark:border-amber-900/20 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-6 text-gray-600 dark:text-gray-300 flex items-center gap-2">
              ⏱ Stopwatch
            </h2>
            <div className="text-6xl sm:text-7xl font-mono font-bold mb-8 text-amber-500 tracking-tighter">
              {hours > 0 ? formattedplushour : formatted}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {!running ? (
                <button
                  onClick={start}
                  className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-all hover:shadow-lg active:scale-95"
                >
                  <Play size={20} fill="currentColor" /> Start
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="flex items-center gap-2 px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-2xl font-bold transition-all hover:shadow-lg active:scale-95"
                >
                  <Pause size={20} fill="currentColor" /> Pause
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-95"
              >
                <RotateCcw size={20} /> Reset
              </button>

              {centis > 100 && (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all hover:shadow-lg active:scale-95 w-full sm:w-auto"
                >
                  <CheckCircle2 size={20} /> Finish Session
                </button>
              )}
            </div>
          </div>

          {/* Music & Ambience Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-amber-100 dark:border-amber-900/20">
              <h2 className="text-lg font-semibold mb-4 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Music size={20} className="text-amber-500" /> Lo-fi Radio
              </h2>

              {/* YouTube Embed */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-black shadow-inner">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeVideo}?autoplay=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Station Selection */}
              <div className="grid grid-cols-2 gap-2">
                {LOFI_VIDEOS.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideo(video.id)}
                    className={`text-xs p-2 rounded-xl transition-all border ${activeVideo === video.id
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      }`}
                  >
                    {video.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Ambient Sounds (Visual feedback) */}
            <div className="flex justify-between gap-4 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-200/50 dark:border-amber-800/20">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm px-2">
                Ambient Moods:
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveVideo("bo_uzXpUStY")}
                  className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:scale-110 transition-all text-amber-600"
                >
                  <Coffee size={20} />
                </button>
                <button
                  onClick={() => setActiveVideo("mPZkdNFkNps")}
                  className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:scale-110 transition-all text-blue-500"
                >
                  <CloudRain size={20} />
                </button>
                <button
                  onClick={() => setActiveVideo("jfKfPfyJRdk")}
                  className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md hover:scale-110 transition-all text-green-500"
                >
                  <TreePine size={20} />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Focus Tips for Students */}
        {!isFocusMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-2xl">
              <h3 className="text-blue-700 dark:text-blue-400 font-bold text-sm mb-1">Pomodoro Tip</h3>
              <p className="text-xs text-blue-600 dark:text-blue-300/80">Try focusing for 25 mins, then take a 5 min break to keep your brain fresh.</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 rounded-2xl">
              <h3 className="text-purple-700 dark:text-purple-400 font-bold text-sm mb-1">Deep Work</h3>
              <p className="text-xs text-purple-600 dark:text-purple-300/80">Turn off notifications and enter "Focus Mode" to eliminate visual clutter.</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 rounded-2xl">
              <h3 className="text-green-700 dark:text-green-400 font-bold text-sm mb-1">Hydration</h3>
              <p className="text-xs text-green-600 dark:text-green-300/80">Don't forget to drink water! Staying hydrated improves concentration.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
