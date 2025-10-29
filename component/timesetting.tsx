// ...existing code...
"use client";
import React, { useState, useRef, useEffect } from "react";

export default function TimeSetting() {
  // centiseconds (1 = 10ms). Using centiseconds makes formatting easy.
  const [centis, setCentis] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);

  // Start the stopwatch
  const start = () => {
    if (intervalRef.current !== null) return; // already running
    intervalRef.current = window.setInterval(() => {
      setCentis((c) => c + 1);
    }, 10); // 10ms -> 1 centisecond
    setRunning(true);
  };

  // Pause/stop the stopwatch
  const stop = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  // Reset to zero
  const reset = () => {
    stop();
    setCentis(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format centiseconds to MM:SS.CS
  const hours = Math.floor(centis / 360000);
  const minutes = Math.floor(centis / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const cs = centis % 100;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  const formattedplushour = `${String(hours).padStart(2, "0")}: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;

  return (
    <div className="p-4 mt-10">
      <h2 className="text-4xl font-semibold mb-2 text-center font-serif" >Timer</h2>
      <div className="text-7xl font-mono mb-4 ">{minutes >= 60 ? formattedplushour : formatted}</div>
      <div className="flex gap-6 font-serif">
        <button
          onClick={start}
          className="px-7 py-2 bg-green-500 text-black rounded cursor-pointer disabled:opacity-50"
          disabled={running}
        >
          Start
        </button>
        <button
          onClick={stop}
          className="px-7 py-2 bg-yellow-400 text-black rounded disabled:opacity-50 cursor-pointer"
          disabled={!running}
        >
          Pause
        </button>
        <button onClick={reset} className="px-7 py-2 bg-red-500 text-black rounded cursor-pointer">
          Reset
        </button>
      </div>
    </div>
  );
}
// ...existing code...