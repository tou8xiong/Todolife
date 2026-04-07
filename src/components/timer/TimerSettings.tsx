"use client";
import React, { useState, useRef, useEffect } from "react";
import { CloudRain, TreePine, Music, Maximize2, Minimize2, Play, Pause, RotateCcw, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

const PRESET_VIDEOS = [
  { id: "jfKfPfyJRdk", name: "Lofi Girl" },
  { id: "mPZkdNFkNps", name: "Rainy Tokyo" },
  { id: "4xDzrJKXOOY", name: "Synthwave" },
];

export default function TimerSettings() {
  const [centis, setCentis] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [iframeSrc, setIframeSrc] = useState(`https://www.youtube.com/embed/${PRESET_VIDEOS[0].id}?autoplay=0`);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setIframeSrc(`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}`);
    setActiveLabel(q);
    setSearchInput("");
  };

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
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-amber-100 dark:border-amber-900/20 space-y-4">
            <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Music size={20} className="text-amber-500" /> Lo-fi Radio
            </h2>

            {/* YouTube Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search YouTube…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
              >
                Search
              </button>
            </form>

            {/* YouTube Embed */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
              <iframe
                key={iframeSrc}
                width="100%"
                height="100%"
                src={iframeSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Preset buttons */}
            <div className="flex gap-2">
              {PRESET_VIDEOS.map((video) => (
                <button
                  key={video.id}
                  onClick={() => {
                    setIframeSrc(`https://www.youtube.com/embed/${video.id}?autoplay=0`);
                    setActiveLabel(video.name);
                  }}
                  className={`flex-1 text-xs py-2 px-2 rounded-xl transition-all border ${iframeSrc.includes(video.id)
                    ? "bg-amber-500 text-white border-amber-500 shadow-md"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  }`}
                >
                  {video.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setIframeSrc(`https://www.youtube.com/embed/mPZkdNFkNps?autoplay=0`);
                  setActiveLabel("Rainy Tokyo");
                }}
                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 border border-transparent transition-all"
                title="Rainy Ambience"
              >
                <CloudRain size={16} />
              </button>
              <button
                onClick={() => {
                  setIframeSrc(`https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0`);
                  setActiveLabel("Lofi Girl");
                }}
                className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 border border-transparent transition-all"
                title="Nature Sounds"
              >
                <TreePine size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
