"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import { useLanguage } from "@/context/LanguageContext";
import { BookOpen, Clock, Zap, Target, CheckCircle } from "lucide-react";

interface Idea {
    id: number;
    ideatext: string;
}

interface StudySession {
    id: number;
    duration: number; // in centiseconds
    timestamp: string;
    videoName: string;
}

function getGreeting(t: any) {
    const h = new Date().getHours();
    if (h < 12) return t.goodMorning;
    if (h < 17) return t.goodAfternoon;
    if (h < 21) return t.goodEvening;
    return t.goodNight;
}

function formatDuration(centis: number) {
    const totalSeconds = Math.floor(centis / 100);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ── Study Stats ──────────────────────────────────────────────────────────────
function StudyStats({ sessions }: { sessions: StudySession[] }) {
    const { t } = useLanguage();
    const d = t.dashboard;
    const totalCentis = sessions.reduce((acc, s) => acc + s.duration, 0);
    const recent = [...sessions].reverse().slice(0, 3);

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-500" /> {d.studyStats}
                </h2>
                <div className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-bold">
                    {d.total}: {formatDuration(totalCentis)}
                </div>
            </div>

            {sessions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-200 text-sm italic">{d.noStudySessions}</p>
            ) : (
                <div className="space-y-3">
                    <p className="text-xs text-gray-400 dark:text-gray-200 uppercase font-bold tracking-wider">{d.recentSessions}</p>
                    {recent.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="p-2 bg-white/10 rounded-lg shadow-sm">
                                <Clock size={16} className="text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{s.videoName}</p>
                                <p className="text-xs text-gray-300">{new Date(s.timestamp).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-mono font-bold text-amber-400">{formatDuration(s.duration)}</span>
                        </div>
                    ))}
                </div>
            )}
            <a href="/settimepage" className="text-xs text-blue-500 hover:underline mt-1 block">
                {d.openStudyHub} →
            </a>
        </div>
    );
}

// ── Pomodoro Timer ──────────────────────────────────────────────────────────
function PomodoroTimer({ tasks }: { tasks: Task[] }) {
    const { t } = useLanguage();
    const d = t.dashboard;
    const DURATION = 25 * 60;
    const [secondsLeft, setSecondsLeft] = useState(DURATION);
    const [running, setRunning] = useState(false);
    const [focusTask, setFocusTask] = useState("");
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (running) {
            intervalRef.current = window.setInterval(() => {
                setSecondsLeft((s) => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current!);
                        setRunning(false);
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification("🍅 Pomodoro Done!", { body: "Great focus session! Time for a break." });
                        }
                        return DURATION;
                    }
                    return s - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running]);

    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    const progress = ((DURATION - secondsLeft) / DURATION) * 100;

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-5 flex flex-col gap-3 transition-all">
            <h2 className="text-lg font-bold text-white">⏱ {d.focusTimer}</h2>
            <select
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                className="border rounded-lg p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-gray-700 dark:border-gray-600 outline-none"
            >
                <option value="">{d.selectTaskToFocus}</option>
                {tasks.map((t) => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                ))}
            </select>
            {focusTask && (
                <p className="text-xs text-amber-600 font-medium truncate">{d.focusing} {focusTask}</p>
            )}
            <div className="text-5xl font-mono text-center text-slate-900 dark:text-white py-2">
                {minutes}:{seconds}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-200">{d.pomodoroSession}</p>
            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setRunning(true)}
                    disabled={running}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-40 text-sm transition-colors"
                >{d.start}</button>
                <button
                    onClick={() => setRunning(false)}
                    disabled={!running}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg disabled:opacity-40 text-sm transition-colors"
                >{d.pause}</button>
                <button
                    onClick={() => { setRunning(false); setSecondsLeft(DURATION); }}
                    className="px-4 py-2 bg-red-400 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
                >{d.reset}</button>
            </div>
        </div>
    );
}

// ── Weekly Chart ─────────────────────────────────────────────────────────────
function WeeklyChart({ tasks }: { tasks: Task[] }) {
    const { t } = useLanguage();
    const d = t.dashboard;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const counts = days.map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + mondayOffset + i);
        const dateStr = d.toISOString().split("T")[0];
        return tasks.filter((t) => t.completedAt?.startsWith(dateStr)).length;
    });

    const max = Math.max(...counts, 1);

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-5 transition-all">
            <h2 className="text-lg font-bold text-white mb-4">📈 {d.weeklyProgress}</h2>
            <div className="flex items-end gap-2 h-28">
                {days.map((day, i) => (
                    <div key={day} className="flex flex-col items-center flex-1 gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-200">{counts[i] || ""}</span>
                        <div
                            className="w-full bg-amber-400 rounded-t transition-all"
                            style={{ height: `${(counts[i] / max) * 100}%`, minHeight: counts[i] > 0 ? "6px" : "2px", opacity: counts[i] > 0 ? 1 : 0.15 }}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-200">{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const { locale, t } = useLanguage();
    const d = t.dashboard;
    const [user, setUser] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [studySessions, setStudySessions] = useState<StudySession[]>([]);
    const [streakDays, setStreak] = useState(0);
    const [redirecting, setRedirecting] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(true);

    const todayStr = new Date().toISOString().split("T")[0];

    const loadData = async (email: string) => {
        try {
            setLoadingTasks(true);
            const [tasksRes, ideasRes] = await Promise.all([
                fetch(`/api/tasks?email=${encodeURIComponent(email)}`),
                fetch(`/api/ideas?email=${encodeURIComponent(email)}`),
            ]);
            const tasksData = await tasksRes.json();
            const ideasData = await ideasRes.json();

            const storedTasks: Task[] = tasksData.tasks ?? [];
            setTasks(storedTasks);
            setIdeas(ideasData.ideas ?? []);
            setStudySessions(JSON.parse(localStorage.getItem(`study_sessions_${email}`) || "[]"));

            let s = 0;
            const d = new Date();
            while (true) {
                const ds = d.toISOString().split("T")[0];
                if (!storedTasks.some((t) => t.completedAt?.startsWith(ds))) break;
                s++;
                d.setDate(d.getDate() - 1);
            }
            setStreak(s);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u && !redirecting) {
                setRedirecting(true);
                window.location.href = "/formlogin?redirect=/dashboard";
                return;
            }
            setUser(u);
            if (u?.email) loadData(u.email);
        });
        return () => unsub();
    }, []);

    const pendingTasks = tasks.filter((t) => !t.completed);
    const todayTasks = pendingTasks.filter((t) => t.date === todayStr);
    const todayDoneCount = tasks.filter((t) => t.completed && t.completedAt?.startsWith(todayStr)).length;
    const overdueTasks = pendingTasks.filter((t) => {
        if (!t.date) return false;
        return new Date(`${t.date}T${t.time || "23:59"}`).getTime() < Date.now();
    });

    const handleMarkDone = async (id: number) => {
        const updated = tasks.map((t) =>
            t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        );
        setTasks(updated);
        await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, tasks: updated }),
        });
        window.dispatchEvent(new Event("tasksUpdated"));
    };

    const displayName = user?.displayName || user?.email?.split("@")[0] || "there";

    if (redirecting || !user) {
        return (
            <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-600 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-600 p-4 sm:p-6 font-serif text-white">

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">
                        {getGreeting(d)}, {displayName} 👋
                    </h1>
                    <p className="text-gray-300 text-sm mt-1">
                        {new Date().toLocaleDateString(locale === "lo" ? "lo-LA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <a
                    href="/newtasks"
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    <span className="text-lg leading-none">+</span> {d.addATask}
                </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                    { icon: <CheckCircle size={20} className="text-green-400" />, label: d.completedToday, value: todayDoneCount, color: "text-green-400" },
                    { icon: <Clock size={20} className="text-amber-400" />, label: d.pending, value: pendingTasks.length, color: "text-amber-400" },
                    { icon: <Zap size={20} className="text-orange-400" />, label: d.dayStreak, value: streakDays, color: "text-orange-400" },
                    { icon: <Target size={20} className="text-blue-400" />, label: d.dueToday, value: todayTasks.length, color: "text-blue-400" },
                ].map((card, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-4 flex flex-col gap-1 transition-all">
                        <span className="text-2xl">{card.icon}</span>
                        <span className={`text-3xl font-bold ${card.color}`}>{card.value}</span>
                        <span className="text-xs text-gray-300">{card.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-5 transition-all">
                    <h2 className="text-lg font-bold text-white mb-3">📅 {d.todaysTasks}</h2>
                    {todayTasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-200 text-sm">{d.noTasksToday}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {todayTasks.map((task) => (
                                <li key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                    <button
                                        onClick={() => handleMarkDone(task.id)}
                                        className="w-5 h-5 rounded-full border-2 border-amber-400 hover:bg-amber-400 shrink-0 transition"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                                        {task.time && <p className="text-xs text-gray-300">{task.time}</p>}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${task.priority?.toLowerCase() === "high" ? "bg-red-100 text-red-600" :
                                        task.priority?.toLowerCase() === "medium" ? "bg-amber-100 text-amber-700 dark:bg-yellow-100 dark:text-yellow-600" :
                                            "bg-green-100 text-green-600"
                                        }`}>{task.priority === "High" ? t.tasks.high : task.priority === "Medium" ? t.tasks.medium : task.priority === "Low" ? t.tasks.low : task.priority}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <StudyStats sessions={studySessions} />
            </div>

            {/* 4 — Pomodoro + Weekly Chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <PomodoroTimer tasks={pendingTasks} />
                <WeeklyChart tasks={tasks} />
            </div>

            {/* 5 — Notes Preview */}
            <div className="grid grid-cols-1 gap-4 mb-5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow p-5 transition-colors duration-300">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">💡 {d.recentNotes}</h2>
                    {ideas.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-200 text-sm">{d.noNotesYet}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {[...ideas].reverse().slice(0, 3).map((idea) => (
                                <li key={idea.id} className="text-sm text-slate-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl truncate">
                                    💡 {idea.ideatext}
                                </li>
                            ))}
                        </ul>
                    )}
                    <a href="/noteidea" className="text-xs text-sky-600 dark:text-amber-500 hover:underline mt-3 block">
                        {d.viewAllNotes} →
                    </a>
                </div>
            </div>

            {/* 6 — Overdue Tasks */}
            {overdueTasks.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
                    <h2 className="text-lg font-bold text-red-600 mb-3">⚠️ {d.overdueTasks}</h2>
                    <ul className="flex flex-col gap-2">
                        {overdueTasks.map((task) => (
                            <li key={task.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-800 shadow-sm dark:shadow-none">
                                <span className="text-xl shrink-0">⏰</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                                    <p className="text-xs text-red-500 dark:text-red-400">{d.due} {task.date} {task.time}</p>
                                </div>
                                <button
                                    onClick={() => handleMarkDone(task.id)}
                                    className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 font-semibold rounded-lg shrink-0 transition-colors"
                                >{t.done}</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
