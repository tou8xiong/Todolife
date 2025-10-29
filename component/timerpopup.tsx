"use client";
import React, { useState, useRef, useEffect } from "react";

export default function TimerPopup() {
    const [isOpen, setIsOpen] = useState(false);
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
    }, [isOpen]);

    const hours = Math.floor(centis / 360000);
    const minutes = Math.floor((centis % 360000) / 6000);
    const seconds = Math.floor((centis % 6000) / 100);
    const cs = centis % 100;
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
    const formattedplushour = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
               {isOpen === false ? "⏱" : "✖" } 
            </button>

            {isOpen && (
                <>
                    <div className="fixed bottom-24 right-6 z-50 bg-white  rounded-lg shadow-xl p-6 w-[320px]">
                        <h2 className="text-2xl font-semibold mb-4 text-center font-serif ">Timer</h2>
                        <div className="text-5xl font-mono mb-6 text-center ">
                            {minutes >= 60 ? formattedplushour : formatted}
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
                                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg disabled:opacity-50 transition-colors"
                                disabled={!running}
                            >
                                Pause
                            </button>
                            <button
                                onClick={reset}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}