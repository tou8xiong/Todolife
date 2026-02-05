"use client";
import React, { useEffect, useRef, useState } from "react";
const LS_RUNNING = "timer:isRunning";
const LS_START = "timer:start";
const LS_ELAPSED = "timer:elapsed";

export default function TimerPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [displayCentis, setDisplayCentis] = useState<number>(0); // centiseconds (1 = 10ms)
    const [running, setRunning] = useState<boolean>(false);
    const startRef = useRef<number | null>(null); // ms
    const elapsedBeforeRef = useRef<number>(0); // ms accumulated when not running
    const intervalRef = useRef<number | null>(null);

    // init from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        const isRun = localStorage.getItem(LS_RUNNING) === "1";
        const start = parseInt(localStorage.getItem(LS_START) || "0", 10);
        const elapsed = parseInt(localStorage.getItem(LS_ELAPSED) || "0", 10);

        elapsedBeforeRef.current = isNaN(elapsed) ? 0 : elapsed;
        if (isRun && start && !isNaN(start)) {
            startRef.current = start;
            setRunning(true);
            startTicker();
        } else {
            // not running: update display from elapsedBefore
            setDisplayCentis(Math.floor(elapsedBeforeRef.current / 10));
            setRunning(false);
        }

        return () => {
            stopTicker();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ticker uses Date.now() to compute accurate elapsed time
    const startTicker = () => {
        stopTicker();
        intervalRef.current = window.setInterval(() => {
            const now = Date.now();
            const start = startRef.current ?? now;
            const totalMs = elapsedBeforeRef.current + (now - start);
            setDisplayCentis(Math.floor(totalMs / 10));
        }, 100); // update every 100ms for performance; display still accurate
    };

    const stopTicker = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const start = () => {
        if (running) return;
        const now = Date.now();
        startRef.current = now;
        localStorage.setItem(LS_START, String(now));
        localStorage.setItem(LS_RUNNING, "1");
        setRunning(true);
        startTicker();
    };

    const stop = () => {
        if (!running) return;
        const now = Date.now();
        const start = startRef.current ?? now;
        const added = now - start;
        elapsedBeforeRef.current = (elapsedBeforeRef.current || 0) + added;
        localStorage.setItem(LS_ELAPSED, String(elapsedBeforeRef.current));
        localStorage.setItem(LS_RUNNING, "0");
        localStorage.removeItem(LS_START);
        startRef.current = null;
        setRunning(false);
        stopTicker();
        setDisplayCentis(Math.floor(elapsedBeforeRef.current / 10));
    };

    const reset = () => {
        stopTicker();
        startRef.current = null;
        elapsedBeforeRef.current = 0;
        localStorage.removeItem(LS_START);
        localStorage.setItem(LS_ELAPSED, "0");
        localStorage.setItem(LS_RUNNING, "0");
        setRunning(false);
        setDisplayCentis(0);
    };

    // format helpers
    const hours = Math.floor(displayCentis / 360000);
    const minutes = Math.floor((displayCentis % 360000) / 6000);
    const seconds = Math.floor((displayCentis % 6000) / 100);
    const cs = displayCentis % 100;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
    const formattedplushour = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;

    return (
        <>
            <button
                onClick={() => setIsOpen((s) => !s)}
                className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                aria-label="Toggle timer"
            >
                {isOpen ? "✖" : "⏱"}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[320px]">
                    <h2 className="text-2xl font-semibold mb-4 text-center text-black dark:text-white  font-serif">Timer</h2>
                    <div className="text-5xl font-mono mb-6 text-center dark:text-white">
                        {minutes > 60 ? formattedplushour : formatted}
                    </div>
                    <div className="flex gap-2 justify-center font-serif">
                        <button
                            onClick={start}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                            disabled={running}
                        >
                            Start
                        </button>
                        <button
                            onClick={stop}
                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 dark:text-white
                             text-black rounded-lg disabled:opacity-50 dark:bg-yellow-400 transition-colors"
                            disabled={!running}
                        >
                            Pause
                        </button>
                        <button onClick={reset} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}