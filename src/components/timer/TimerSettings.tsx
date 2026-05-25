"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  CloudRain, TreePine, Music, Maximize2, Minimize2, Play, Pause,
  RotateCcw, CheckCircle2, Zap, Clock, Target,
  Flame, BarChart2, ListChecks, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";

// ── Constants ────────────────────────────────────────────────────────────────
const PRESET_VIDEOS = [
  { id: "jfKfPfyJRdk", name: "Lofi Girl",    icon: Music,     color: "text-green-400",  bg: "bg-green-900/30",  border: "border-green-700" },
  { id: "mPZkdNFkNps", name: "Rainy Tokyo",  icon: CloudRain, color: "text-blue-400",   bg: "bg-blue-900/30",   border: "border-blue-700" },
  { id: "4xDzrJKXOOY", name: "Synthwave",    icon: Zap,       color: "text-purple-400", bg: "bg-purple-900/30", border: "border-purple-700" },
  { id: "DWcJFNfaw9c", name: "Forest",       icon: TreePine,  color: "text-emerald-400",bg: "bg-emerald-900/30",border: "border-emerald-700" },
];

const POMODORO_WORK  = 25 * 60; // seconds
const POMODORO_BREAK =  5 * 60;

type Mode = "stopwatch" | "pomodoro" | "countdown";
type PomPhase = "work" | "break";

interface Session {
  id: number;
  duration: number; // centiseconds for stopwatch, seconds for others
  timestamp: string;
  videoName: string;
  label: string;
  mode: Mode;
}

function fmtCentis(c: number) {
  const h = Math.floor(c / 360000);
  const m = Math.floor((c % 360000) / 6000);
  const s = Math.floor((c % 6000) / 100);
  const cs = c % 100;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function fmtSecs(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad(m)}:${pad(ss)}`;
}

function fmtDuration(centis: number) {
  const total = Math.floor(centis / 100);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const pad = (n: number) => String(n).padStart(2, "0");

// ── Component ─────────────────────────────────────────────────────────────────
export default function TimerSettings() {
  const { t } = useLanguage();
  const [mode, setMode]               = useState<Mode>("stopwatch");
  const [centis, setCentis]           = useState(0);          // stopwatch centiseconds
  const [countdown, setCountdown]     = useState(25 * 60);    // countdown seconds left
  const [countdownInput, setCountdownInput] = useState({ h: 0, m: 25, s: 0 });
  const [pomSecs, setPomSecs]         = useState(POMODORO_WORK);
  const [pomPhase, setPomPhase]       = useState<PomPhase>("work");
  const [pomCycle, setPomCycle]       = useState(1);
  const [running, setRunning]         = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusLabel, setFocusLabel]   = useState("");
  const [iframeSrc, setIframeSrc]     = useState(`https://www.youtube.com/embed/${PRESET_VIDEOS[0].id}?autoplay=0`);
  const [activeVideo, setActiveVideo] = useState(PRESET_VIDEOS[0]);
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const intervalRef = useRef<number | null>(null);

  // ── Load sessions from localStorage ──────────────────────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (!user?.email) return;
    const key = `study_sessions_${user.email}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]") as Session[];
    setSessions(stored);
  }, []);

  const persistSessions = (list: Session[]) => {
    const user = auth.currentUser;
    if (!user?.email) return;
    localStorage.setItem(`study_sessions_${user.email}`, JSON.stringify(list));
  };

  // ── Timer tick ────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (mode === "stopwatch") {
      setCentis((c) => c + 1);
    } else if (mode === "countdown") {
      setCountdown((c) => {
        if (c <= 1) { stopTimer(); toast.success("Countdown finished! Great work!"); return 0; }
        return c - 1;
      });
    } else {
      setPomSecs((s) => {
        if (s <= 1) {
          setPomPhase((ph) => {
            const next: PomPhase = ph === "work" ? "break" : "work";
            if (next === "work") setPomCycle((c) => c + 1);
            toast.success(next === "break" ? "Time for a break! 🌿" : "Back to work! 💪");
            return next;
          });
          return pomPhase === "work" ? POMODORO_BREAK : POMODORO_WORK;
        }
        return s - 1;
      });
    }
  }, [mode, pomPhase]);

  const stopTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  const startTimer = () => {
    if (intervalRef.current !== null) return;
    const ms = mode === "stopwatch" ? 10 : 1000;
    intervalRef.current = window.setInterval(tick, ms);
    setRunning(true);
  };

  const reset = () => {
    stopTimer();
    if (mode === "stopwatch") setCentis(0);
    else if (mode === "countdown") {
      const { h, m, s } = countdownInput;
      setCountdown(h * 3600 + m * 60 + s);
    } else {
      setPomSecs(POMODORO_WORK);
      setPomPhase("work");
      setPomCycle(1);
    }
  };

  // Re-attach tick whenever mode/pomPhase changes while running
  useEffect(() => {
    if (!running) return;
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    const ms = mode === "stopwatch" ? 10 : 1000;
    intervalRef.current = window.setInterval(tick, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tick, running, mode]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── Save session ──────────────────────────────────────────────────────────
  const handleFinish = () => {
    const user = auth.currentUser;
    if (!user) { toast.error("Please log in to save your session"); return; }

    const duration = mode === "stopwatch" ? centis : 0;
    const session: Session = {
      id: Date.now(), duration,
      timestamp: new Date().toISOString(),
      videoName: activeVideo.name,
      label: focusLabel || "Untitled Session",
      mode,
    };
    const next = [session, ...sessions].slice(0, 20);
    setSessions(next);
    persistSessions(next);
    toast.success("Session saved! Great work! 🎉");
    reset();
  };

  const deleteSession = (id: number) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    persistSessions(next);
  };

  // ── Switch mode ───────────────────────────────────────────────────────────
  const switchMode = (m: Mode) => {
    stopTimer();
    setMode(m);
    setCentis(0);
    const { h, m: mm, s } = countdownInput;
    setCountdown(h * 3600 + mm * 60 + s);
    setPomSecs(POMODORO_WORK);
    setPomPhase("work");
    setPomCycle(1);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todaySessions = sessions.filter((s) => new Date(s.timestamp).toDateString() === today);
  const todayCentis = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  // ── Display values ────────────────────────────────────────────────────────
  const timerDisplay =
    mode === "stopwatch" ? fmtCentis(centis) :
    mode === "countdown" ? fmtSecs(countdown) :
    fmtSecs(pomSecs);

  const pomProgress = mode === "pomodoro"
    ? 1 - pomSecs / (pomPhase === "work" ? POMODORO_WORK : POMODORO_BREAK)
    : 0;

  const canFinish = mode === "stopwatch" ? centis > 100 : false;

  return (
    <div className={`relative w-full min-h-screen flex flex-col items-center bg-tool p-4 sm:p-8 transition-all ${isFocusMode ? "justify-center" : ""}`}>

      {/* Focus mode toggle */}
      <button
        onClick={() => setIsFocusMode(!isFocusMode)}
        className="absolute top-6 right-6 p-2.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all z-20"
        title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
      >
        {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      <div className={`max-w-5xl w-full flex flex-col gap-6 mt-4 pb-12 transition-all ${isFocusMode ? "max-w-md" : ""}`}>


        {/* Mode tabs */}
        <div className="flex items-center justify-center gap-1 bg-gray-800/80 border border-gray-700 rounded-md p-1 self-center">
          {([
            { id: "stopwatch", label: t.timer.stopwatch, icon: Clock },
            { id: "pomodoro",  label: t.timer.pomodoro,  icon: Flame },
            { id: "countdown", label: t.timer.countdown, icon: Target },
          ] as { id: Mode; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === id ? "bg-amber-500 text-white shadow" : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className={`grid gap-5 ${isFocusMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-5"}`}>

          {/* ── Timer Card ── */}
          <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md p-6 flex flex-col items-center gap-5">

            {/* Pomodoro phase badge */}
            {mode === "pomodoro" && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold border ${
                pomPhase === "work"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}>
                {pomPhase === "work" ? <Flame size={13} /> : <TreePine size={13} />}
                {pomPhase === "work" ? `${t.timer.cycle} ${pomCycle} — ${t.timer.focus}` : t.timer.breakTime}
              </div>
            )}

            {/* Timer display */}
            {mode === "pomodoro" ? (
              <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
                <svg viewBox="0 0 120 120" width="200" height="200" className="absolute inset-0">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#374151" strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={pomPhase === "work" ? "#f59e0b" : "#10b981"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - pomProgress)}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="relative font-mono font-bold text-amber-400 tracking-tighter text-4xl">
                  {timerDisplay}
                </span>
              </div>
            ) : (
              <div className="font-mono font-bold text-amber-400 tracking-tighter text-6xl sm:text-7xl">
                {timerDisplay}
              </div>
            )}

            {/* Countdown input */}
            {mode === "countdown" && !running && (
              <div className="flex items-center gap-2">
                {(["h", "m", "s"] as const).map((unit) => (
                  <div key={unit} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400 uppercase">{unit}</span>
                    <input
                      type="number" min={0} max={unit === "h" ? 23 : 59}
                      value={countdownInput[unit]}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(unit === "h" ? 23 : 59, Number(e.target.value)));
                        const next = { ...countdownInput, [unit]: val };
                        setCountdownInput(next);
                        setCountdown(next.h * 3600 + next.m * 60 + next.s);
                      }}
                      className="w-14 text-center bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1.5 text-lg font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Focus label */}
            <input
              value={focusLabel}
              onChange={(e) => setFocusLabel(e.target.value)}
              placeholder={t.timer.whatWorkingOn}
              className="w-full text-center text-sm bg-gray-700/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:border-amber-400 placeholder:text-gray-500"
            />

            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-2">
              {!running ? (
                <button
                  onClick={startTimer}
                  disabled={mode === "countdown" && countdown === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md font-bold transition-all active:scale-95 disabled:opacity-40"
                >
                  <Play size={18} fill="currentColor" /> {t.timer.start}
                </button>
              ) : (
                <button
                  onClick={stopTimer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-md font-bold transition-all active:scale-95"
                >
                  <Pause size={18} fill="currentColor" /> {t.timer.pause}
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold transition-all active:scale-95 border border-gray-600"
              >
                <RotateCcw size={18} /> {t.timer.reset}
              </button>
            </div>

            {canFinish && (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-md font-bold transition-all active:scale-95 w-full justify-center"
              >
                <CheckCircle2 size={18} /> {t.timer.finishSave}
              </button>
            )}

            {/* Quick stats */}
            {!isFocusMode && (
              <div className="grid grid-cols-2 gap-3 w-full pt-1 border-t border-gray-700">
                <div className="bg-gray-700/40 rounded-md p-3 text-center">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">{t.timer.today}</p>
                  <p className="text-white font-bold">{todaySessions.length} {t.timer.sessions}</p>
                </div>
                <div className="bg-gray-700/40 rounded-md p-3 text-center">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">{t.timer.total}</p>
                  <p className="text-amber-400 font-bold">{fmtDuration(todayCentis)}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Panel ── */}
          {!isFocusMode && (
            <div className="lg:col-span-3 flex flex-col gap-5">

              {/* Lo-fi radio */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md p-5 space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Music size={16} className="text-amber-400" /> {t.timer.lofiRadio}
                </h2>

                <div className="aspect-video w-full rounded-md overflow-hidden bg-black ring-1 ring-gray-700">
                  <iframe
                    key={iframeSrc}
                    width="100%" height="100%"
                    src={iframeSrc}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {PRESET_VIDEOS.map((video) => {
                    const Icon = video.icon;
                    const isActive = activeVideo.id === video.id;
                    return (
                      <button
                        key={video.id}
                        onClick={() => {
                          setIframeSrc(`https://www.youtube.com/embed/${video.id}?autoplay=0`);
                          setActiveVideo(video);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                          isActive
                            ? "bg-amber-500 text-white border-amber-500 shadow"
                            : `${video.bg} ${video.color} ${video.border} hover:opacity-80`
                        }`}
                      >
                        <Icon size={13} /> {video.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session history */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-md overflow-hidden">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-700/30 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <ListChecks size={16} className="text-amber-400" />
                    {t.timer.sessionHistory}
                    {sessions.length > 0 && (
                      <span className="bg-amber-500 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {sessions.length}
                      </span>
                    )}
                  </span>
                  {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {showHistory && (
                  <div className="border-t border-gray-700 max-h-56 overflow-y-auto">
                    {sessions.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">{t.timer.noSessions}</p>
                    ) : (
                      <ul className="divide-y divide-gray-700/50">
                        {sessions.map((s) => (
                          <li key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-700/20 transition-colors">
                            <BarChart2 size={14} className="text-amber-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{s.label}</p>
                              <p className="text-[11px] text-gray-400">
                                {s.mode} · {s.videoName} · {new Date(s.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            {s.duration > 0 && (
                              <span className="text-xs text-amber-400 font-mono shrink-0">{fmtDuration(s.duration)}</span>
                            )}
                            <button
                              onClick={() => deleteSession(s.id)}
                              className="p-1 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
