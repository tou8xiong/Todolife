"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import { useLanguage } from "@/context/LanguageContext";
import { authFetch } from "@/lib/authFetch";
import {
  BookOpen, Clock, Zap, Target, CheckCircle, Plus,
  Calendar, Timer, BarChart3, Lightbulb, AlertTriangle,
  Play, Pause, RotateCcw, ArrowRight, TrendingUp,
} from "lucide-react";
import PageHelpTooltip from "@/components/ui/PageHelpTooltip";

interface Idea {
    id: number;
    ideatext: string;
    created_at?: string;
}

interface StudySession {
    id: number;
    duration: number;
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

// Shared card shell — keeps every section visually cohesive
function Card({
    children,
    className = "",
    style,
}: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-gray-700/60 rounded-md shadow-lg ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}

function SectionTitle({
    icon: Icon,
    color = "text-amber-400",
    children,
}: {
    icon: React.ElementType;
    color?: string;
    children: React.ReactNode;
}) {
    return (
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/5 ${color}`}>
                <Icon size={16} />
            </span>
            {children}
        </h2>
    );
}

// ── Study Stats ──────────────────────────────────────────────────────────────
function StudyStats({ sessions }: { sessions: StudySession[] }) {
    const { t } = useLanguage();
    const d = t.dashboard;
    const totalCentis = sessions.reduce((acc, s) => acc + s.duration, 0);
    const recent = [...sessions].reverse().slice(0, 3);

    return (
        <Card className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <SectionTitle icon={BookOpen} color="text-blue-400">{d.studyStats}</SectionTitle>
                <span className="shrink-0 px-2.5 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/20 rounded-md text-xs font-bold">
                    {d.total}: {formatDuration(totalCentis)}
                </span>
            </div>

            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-md border border-dashed border-slate-200 dark:border-gray-700 bg-white/5">
                    <BookOpen size={22} className="text-gray-500" />
                    <p className="text-xs text-slate-500 dark:text-gray-400 text-center px-3 break-words">{d.noStudySessions}</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider">{d.recentSessions}</p>
                    {recent.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-md border border-slate-200 dark:border-gray-700/40">
                            <div className="p-1.5 bg-amber-500/15 rounded-md shrink-0">
                                <Clock size={14} className="text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.videoName}</p>
                                <p className="text-[11px] text-slate-500 dark:text-gray-400">{new Date(s.timestamp).toLocaleDateString()}</p>
                            </div>
                            <span className="text-sm font-mono font-bold text-amber-400 shrink-0">{formatDuration(s.duration)}</span>
                        </div>
                    ))}
                </div>
            )}
            <a
                href="/settimepage"
                className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors mt-auto"
            >
                {d.openStudyHub} <ArrowRight size={12} />
            </a>
        </Card>
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
        <Card className="p-4 sm:p-5 flex flex-col gap-3">
            <SectionTitle icon={Timer} color="text-amber-400">{d.focusTimer}</SectionTitle>

            <select
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-colors"
            >
                <option value="">{d.selectTaskToFocus}</option>
                {tasks.map((t) => (
                    <option key={t.id} value={t.title}>{t.title}</option>
                ))}
            </select>
            {focusTask && (
                <p className="text-xs text-amber-400 font-medium truncate">{d.focusing} {focusTask}</p>
            )}

            <div className="text-5xl sm:text-6xl font-mono font-bold text-center text-slate-900 dark:text-white py-2 tracking-tight">
                {minutes}:{seconds}
            </div>
            <div className="w-full bg-slate-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-center text-[11px] text-slate-500 dark:text-gray-400 uppercase tracking-wider">{d.pomodoroSession}</p>

            <div className="flex gap-2 justify-center mt-1">
                <button
                    onClick={() => setRunning(true)}
                    disabled={running}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-green-500/15 hover:bg-green-500/25 disabled:hover:bg-green-500/15 text-green-400 border border-green-500/30 rounded-md disabled:opacity-40 text-sm font-semibold transition-colors"
                >
                    <Play size={14} /> {d.start}
                </button>
                <button
                    onClick={() => setRunning(false)}
                    disabled={!running}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-yellow-500/15 hover:bg-yellow-500/25 disabled:hover:bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-md disabled:opacity-40 text-sm font-semibold transition-colors"
                >
                    <Pause size={14} /> {d.pause}
                </button>
                <button
                    onClick={() => { setRunning(false); setSecondsLeft(DURATION); }}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-md text-sm font-semibold transition-colors"
                >
                    <RotateCcw size={14} /> {d.reset}
                </button>
            </div>
        </Card>
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
    const todayIdx = (dayOfWeek + 6) % 7;

    const counts = days.map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + mondayOffset + i);
        const dateStr = d.toISOString().split("T")[0];
        return tasks.filter((t) => t.completedAt?.startsWith(dateStr)).length;
    });

    const max = Math.max(...counts, 1);
    const total = counts.reduce((a, b) => a + b, 0);

    return (
        <Card className="p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <SectionTitle icon={BarChart3} color="text-purple-400">{d.weeklyProgress}</SectionTitle>
                <span className="shrink-0 px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/20 rounded-md text-xs font-bold">
                    {total}
                </span>
            </div>
            <div className="flex items-end gap-2 h-32 sm:h-36 pt-2">
                {days.map((day, i) => {
                    const isToday = i === todayIdx;
                    return (
                        <div key={day} className="flex flex-col items-center flex-1 gap-1 min-w-0">
                            <span className={`text-[11px] font-bold ${counts[i] > 0 ? (isToday ? "text-amber-400" : "text-slate-900 dark:text-white") : "text-transparent"}`}>
                                {counts[i] || "·"}
                            </span>
                            <div
                                className={`w-full rounded-t transition-all ${isToday ? "bg-amber-400" : "bg-amber-400/60"}`}
                                style={{
                                    height: `${(counts[i] / max) * 100}%`,
                                    minHeight: counts[i] > 0 ? "8px" : "3px",
                                    opacity: counts[i] > 0 ? 1 : 0.2,
                                }}
                            />
                            <span className={`text-[11px] ${isToday ? "text-amber-400 font-bold" : "text-slate-500 dark:text-gray-400"}`}>{day}</span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

// ── Feature Usage Chart ──────────────────────────────────────────────────────
type RangeKey = "today" | "week" | "month" | "halfyear" | "year";

type Bucket = {
    key: string;
    label: string;
    start: number;
    end: number;
};

function makeBuckets(range: RangeKey): Bucket[] {
    const now = new Date();
    const buckets: Bucket[] = [];

    if (range === "today") {
        // 24 hourly buckets for the current day
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        for (let h = 0; h < 24; h++) {
            const s = new Date(dayStart);
            s.setHours(h);
            const e = new Date(s);
            e.setHours(s.getHours() + 1);
            buckets.push({
                key: `h${h}`,
                label: h % 3 === 0 ? `${h}h` : "",
                start: s.getTime(),
                end: e.getTime(),
            });
        }
    } else if (range === "week") {
        // 7 days, ending today
        for (let i = 6; i >= 0; i--) {
            const s = new Date(now);
            s.setHours(0, 0, 0, 0);
            s.setDate(s.getDate() - i);
            const e = new Date(s);
            e.setDate(s.getDate() + 1);
            buckets.push({
                key: s.toISOString().slice(0, 10),
                label: s.toLocaleDateString(undefined, { weekday: "short" }),
                start: s.getTime(),
                end: e.getTime(),
            });
        }
    } else if (range === "month") {
        // 30 days
        for (let i = 29; i >= 0; i--) {
            const s = new Date(now);
            s.setHours(0, 0, 0, 0);
            s.setDate(s.getDate() - i);
            const e = new Date(s);
            e.setDate(s.getDate() + 1);
            buckets.push({
                key: s.toISOString().slice(0, 10),
                label: i % 5 === 0 ? `${s.getDate()}` : "",
                start: s.getTime(),
                end: e.getTime(),
            });
        }
    } else if (range === "halfyear") {
        // 26 weeks
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        const dow = (weekStart.getDay() + 6) % 7;
        weekStart.setDate(weekStart.getDate() - dow);
        for (let i = 25; i >= 0; i--) {
            const s = new Date(weekStart);
            s.setDate(s.getDate() - i * 7);
            const e = new Date(s);
            e.setDate(s.getDate() + 7);
            buckets.push({
                key: `w${s.toISOString().slice(0, 10)}`,
                label: i % 4 === 0 ? s.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "",
                start: s.getTime(),
                end: e.getTime(),
            });
        }
    } else {
        // 12 months
        for (let i = 11; i >= 0; i--) {
            const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            buckets.push({
                key: `m${s.getFullYear()}-${s.getMonth()}`,
                label: s.toLocaleDateString(undefined, { month: "short" }),
                start: s.getTime(),
                end: e.getTime(),
            });
        }
    }
    return buckets;
}

function FeatureUsageChart({
    tasks,
    ideas,
    studySessions,
}: {
    tasks: Task[];
    ideas: Idea[];
    studySessions: StudySession[];
}) {
    const [range, setRange] = useState<RangeKey>("week");
    const [hover, setHover] = useState<number | null>(null);

    const ranges: { value: RangeKey; label: string }[] = [
        { value: "today", label: "Today" },
        { value: "week", label: "Week" },
        { value: "month", label: "Month" },
        { value: "halfyear", label: "6M" },
        { value: "year", label: "Year" },
    ];

    const data = useMemo(() => {
        const buckets = makeBuckets(range);
        const taskTimes = tasks
            .filter((t) => t.completedAt)
            .map((t) => new Date(t.completedAt as string).getTime())
            .filter((t) => !isNaN(t));
        const ideaTimes = ideas
            .filter((i) => i.created_at)
            .map((i) => new Date(i.created_at as string).getTime())
            .filter((t) => !isNaN(t));
        const studyTimes = studySessions
            .map((s) => new Date(s.timestamp).getTime())
            .filter((t) => !isNaN(t));

        return buckets.map((b) => {
            const inBucket = (t: number) => t >= b.start && t < b.end;
            const tCount = taskTimes.filter(inBucket).length;
            const nCount = ideaTimes.filter(inBucket).length;
            const sCount = studyTimes.filter(inBucket).length;
            return { ...b, tasks: tCount, notes: nCount, study: sCount, total: tCount + nCount + sCount };
        });
    }, [tasks, ideas, studySessions, range]);

    const max = Math.max(...data.map((d) => d.total), 1);
    const grandTotal = data.reduce((acc, d) => acc + d.total, 0);

    return (
        <Card className="p-4 sm:p-5 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "325ms" }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <SectionTitle icon={TrendingUp} color="text-amber-400">Feature Usage</SectionTitle>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                        {grandTotal} {grandTotal === 1 ? "activity" : "activities"} in selected range
                    </p>
                </div>
                <div className="flex gap-0.5 p-1 bg-slate-100/80 dark:bg-gray-800/60 rounded-md border border-slate-200 dark:border-gray-700/50 flex-wrap">
                    {ranges.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${range === r.value
                                ? "bg-amber-500 text-gray-900"
                                : "text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] sm:text-xs">
                <span className="flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Tasks done
                </span>
                <span className="flex items-center gap-1.5 text-yellow-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />Notes added
                </span>
                <span className="flex items-center gap-1.5 text-blue-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />Study sessions
                </span>
            </div>

            <div className="relative">
                <div className="flex items-end gap-0.5 sm:gap-1 h-40 sm:h-48 pt-2">
                    {data.map((b, i) => {
                        const heightPct = (b.total / max) * 100;
                        const taskPct = b.total > 0 ? (b.tasks / b.total) * 100 : 0;
                        const notePct = b.total > 0 ? (b.notes / b.total) * 100 : 0;
                        const studyPct = b.total > 0 ? (b.study / b.total) * 100 : 0;
                        const isHover = hover === i;
                        return (
                            <div
                                key={`${b.key}-${range}`}
                                className="flex-1 flex flex-col justify-end min-w-0 h-full relative"
                                onMouseEnter={() => setHover(i)}
                                onMouseLeave={() => setHover(null)}
                            >
                                <div
                                    className={`w-full flex flex-col-reverse rounded-t overflow-hidden transition-all animate-grow-up ${isHover ? "ring-1 ring-amber-400/60" : ""}`}
                                    style={{
                                        height: `${heightPct}%`,
                                        minHeight: b.total > 0 ? "4px" : "2px",
                                        opacity: b.total > 0 ? 1 : 0.15,
                                        background: b.total === 0 ? "rgba(251,191,36,0.5)" : undefined,
                                        animationDelay: `${i * 35}ms`,
                                    }}
                                >
                                    {b.tasks > 0 && <div style={{ height: `${taskPct}%` }} className="bg-emerald-400" />}
                                    {b.notes > 0 && <div style={{ height: `${notePct}%` }} className="bg-yellow-400" />}
                                    {b.study > 0 && <div style={{ height: `${studyPct}%` }} className="bg-blue-400" />}
                                </div>

                                {isHover && b.total > 0 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 whitespace-nowrap px-2 py-1.5 rounded-md bg-gray-950 border border-slate-200 dark:border-gray-700 shadow-lg text-[11px] leading-tight pointer-events-none">
                                        <p className="font-bold text-white dark:text-white">{b.tasks + b.notes + b.study} total</p>
                                        {b.tasks > 0 && <p className="text-emerald-400">{b.tasks} tasks</p>}
                                        {b.notes > 0 && <p className="text-yellow-400">{b.notes} notes</p>}
                                        {b.study > 0 && <p className="text-blue-400">{b.study} study</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-0.5 sm:gap-1 mt-1.5">
                    {data.map((b, i) => (
                        <div key={`l-${b.key}`} className="flex-1 min-w-0 text-center text-[10px] text-slate-500 dark:text-gray-400 truncate">
                            {b.label}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
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

    const todayStr = new Date().toISOString().split("T")[0];

    const loadData = async (email: string) => {
        try {
            const [tasksRes, ideasRes] = await Promise.all([
                authFetch(`/api/tasks`),
                authFetch(`/api/ideas`),
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
        await authFetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tasks: updated }),
        });
        window.dispatchEvent(new Event("tasksUpdated"));
    };

    const displayName = user?.displayName || user?.email?.split("@")[0] || "there";

    if (redirecting || !user) {
        return (
            <div className="min-h-screen bg-tool flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-amber-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    const priorityStyle = (p?: string) => {
        const k = p?.toLowerCase();
        if (k === "high") return "bg-red-500/15 text-red-300 border-red-500/30";
        if (k === "medium") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    };
    const priorityLabel = (p?: string) =>
        p === "High" ? t.tasks.high : p === "Medium" ? t.tasks.medium : p === "Low" ? t.tasks.low : p;

    const stats = [
        { icon: CheckCircle, label: d.completedToday, value: todayDoneCount, accent: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25" },
        { icon: Clock, label: d.pending, value: pendingTasks.length, accent: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25" },
        { icon: Zap, label: d.dayStreak, value: streakDays, accent: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/25" },
        { icon: Target, label: d.dueToday, value: todayTasks.length, accent: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/25" },
    ];

    return (
        <div className="min-h-screen bg-tool px-3 sm:px-5 lg:px-6 pt-4 sm:pt-6 pb-16 sm:pb-20 font-serif text-slate-900 dark:text-white transition-colors">
            <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-5">

                {/* ── Hero ── */}
                <Card className="relative overflow-hidden p-5 sm:p-6 animate-fade-in-up">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-blue-500/10 pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                                <span className="break-words">{getGreeting(d)}, {displayName} <span className="inline-block">👋</span></span>
                                <PageHelpTooltip subtitle={t.pageHelp.dashboard.subtitle} description={t.pageHelp.dashboard.description} />
                            </h1>
                            <p className="text-slate-600 dark:text-gray-300 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                                <Calendar size={14} className="shrink-0" />
                                {new Date().toLocaleDateString(locale === "lo" ? "lo-LA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </p>
                        </div>
                        <a
                            href="/newtasks"
                            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-md text-sm font-bold transition-colors shadow-md shadow-amber-500/20"
                        >
                            <Plus size={16} /> {d.addATask}
                        </a>
                    </div>
                </Card>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {stats.map((s, i) => (
                        <Card key={i} className={`p-3 sm:p-4 flex items-center gap-3 hover:border-gray-600/80 transition-colors animate-fade-in-up`} style={{ animationDelay: `${100 + i * 75}ms` }}>
                            <div className={`shrink-0 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-md ${s.bg} border ${s.border}`}>
                                <s.icon size={18} className={s.accent} />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xl sm:text-2xl font-bold ${s.accent} leading-tight`}>{s.value}</p>
                                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-gray-400 truncate">{s.label}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* ── Feature Usage Chart ── */}
                <FeatureUsageChart tasks={tasks} ideas={ideas} studySessions={studySessions} />

                {/* ── Today's Tasks + Study Stats ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                    <Card className="lg:col-span-2 p-4 sm:p-5 flex flex-col gap-3">
                        <SectionTitle icon={Calendar} color="text-amber-400">{d.todaysTasks}</SectionTitle>
                        {todayTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-md border border-dashed border-slate-200 dark:border-gray-700 bg-white/5">
                                <CheckCircle size={26} className="text-gray-500" />
                                <p className="text-sm text-slate-500 dark:text-gray-400 text-center px-3 break-words">{d.noTasksToday}</p>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {todayTasks.map((task) => (
                                    <li key={task.id} className="flex items-center gap-3 p-3 rounded-md border border-slate-200 dark:border-gray-700/50 bg-white/5 hover:bg-white/10 transition-colors">
                                        <button
                                            onClick={() => handleMarkDone(task.id)}
                                            aria-label="Mark done"
                                            className="w-5 h-5 rounded-full border-2 border-amber-400 hover:bg-amber-400 shrink-0 transition-colors"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                                            {task.time && (
                                                <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Clock size={11} /> {task.time}
                                                </p>
                                            )}
                                        </div>
                                        {task.priority && (
                                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border capitalize shrink-0 ${priorityStyle(task.priority)}`}>
                                                {priorityLabel(task.priority)}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                    <StudyStats sessions={studySessions} />
                </div>

                {/* ── Pomodoro + Weekly Chart ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "475ms" }}>
                    <PomodoroTimer tasks={pendingTasks} />
                    <WeeklyChart tasks={tasks} />
                </div>

                {/* ── Recent Notes ── */}
                <Card className="p-4 sm:p-5 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "550ms" }}>
                    <div className="flex items-center justify-between gap-2">
                        <SectionTitle icon={Lightbulb} color="text-yellow-400">{d.recentNotes}</SectionTitle>
                        <a
                            href="/noteidea"
                            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                            {d.viewAllNotes} <ArrowRight size={12} />
                        </a>
                    </div>
                    {ideas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-md border border-dashed border-slate-200 dark:border-gray-700 bg-white/5">
                            <Lightbulb size={22} className="text-gray-500" />
                            <p className="text-xs text-slate-500 dark:text-gray-400 text-center px-3 break-words">{d.noNotesYet}</p>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[...ideas].reverse().slice(0, 3).map((idea) => (
                                <li
                                    key={idea.id}
                                    className="text-sm text-slate-700 dark:text-gray-200 p-3 bg-white/5 border border-slate-200 dark:border-gray-700/50 rounded-md break-words line-clamp-3"
                                >
                                    {idea.ideatext}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {/* ── Overdue Tasks ── */}
                {overdueTasks.length > 0 && (
                    <Card className="p-4 sm:p-5 border-red-500/30 bg-red-950/30 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
                        <SectionTitle icon={AlertTriangle} color="text-red-400">{d.overdueTasks}</SectionTitle>
                        <ul className="flex flex-col gap-2">
                            {overdueTasks.map((task) => (
                                <li key={task.id} className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-900/60 border border-red-500/20 rounded-md">
                                    <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-500/15 border border-red-500/30">
                                        <Clock size={14} className="text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                                        <p className="text-[11px] text-red-300">{d.due} {task.date} {task.time}</p>
                                    </div>
                                    <button
                                        onClick={() => handleMarkDone(task.id)}
                                        className="text-xs px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold rounded-md shrink-0 transition-colors"
                                    >
                                        {t.done}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </div>
    );
}
