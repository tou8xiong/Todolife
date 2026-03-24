"use client";
import React, { useState, useRef, useEffect } from "react";

export default function TimerSettings() {
  const [centis, setCentis] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [running, setRunning] = useState<boolean>(false);

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

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const hours = Math.floor(centis / 360000);
  const minutes = Math.floor(centis / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const cs = centis % 100;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  const formattedplushour = `${String(hours).padStart(2, "0")}: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;

  return (
    <div className="p-4 mt-10 flex flex-col flex-wrap">
      <h2 className="sm:text-4xl text-xl font-semibold mb-2 text-center font-serif">Timer</h2>
      <div className="sm:text-7xl text-5xl flex justify-center font-mono mb-4">
        {minutes >= 60 ? formattedplushour : formatted}
      </div>
      <div className="flex sm:gap-6 gap-3 font-serif">
        <button
          onClick={start}
          className="sm:px-7 px-5 py-2 bg-green-500 text-black rounded cursor-pointer disabled:opacity-50"
          disabled={running}
        >
          Start
        </button>
        <button
          onClick={stop}
          className="sm:px-7 px-5 py-2 bg-yellow-400 text-black rounded disabled:opacity-50 cursor-pointer"
          disabled={!running}
        >
          Pause
        </button>
        <button onClick={reset} className="sm:px-7 px-5 py-2 bg-red-500 text-black rounded cursor-pointer">
          Reset
        </button>
      </div>
    </div>
  );
}
