"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import { useLanguage } from "@/context/LanguageContext";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteitems";
import { saveTasksToDB } from "@/lib/taskDB";

const getDeadlineUrgency = (date?: string, time?: string) => {
    if (!date) return null;
    const deadline = new Date(`${date}T${time || "23:59"}`).getTime();
    const hoursLeft = (deadline - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft <= 0) return "missed";
    if (hoursLeft <= 1) return "critical";   // ~red
    if (hoursLeft <= 24) return "warning";   // ~orange
    return null;
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case "High": return "bg-red-100 text-red-600 border-red-400";
        case "Medium": return "bg-yellow-100 text-yellow-600 border-yellow-400";
        case "Low": return "bg-green-100 text-green-600 border-green-400";
        default: return "bg-gray-100 text-gray-600 border-gray-400";
    }
};

export default function TaskList() {
    const { t } = useLanguage();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [titledit, setTitleEdit] = useState("");
    const [descritionedit, setDescittionEdit] = useState("");
    const [dateedit, setDateEdit] = useState("");
    const [timeedit, settimeEdit] = useState("");
    const [editPopup, setEditPopup] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [user, setUser] = useState<any>(null);
    const notifiedRef = useRef<Set<string>>(new Set());
    // Holds ALL tasks (pending + completed) so mutations never lose completed tasks
    const allTasksRef = useRef<Task[]>([]);

    // Register service worker + request periodic background sync
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const setup = async () => {
            try {
                const reg = await navigator.serviceWorker.register("/sw.js");

                // Ask for notification permission
                const permission = await Notification.requestPermission();
                if (permission !== "granted") return;

                // Register periodic background sync (Chrome/Edge only)
                if ("periodicSync" in reg) {
                    const status = await navigator.permissions.query({
                        name: "periodic-background-sync" as PermissionName,
                    });
                    if (status.state === "granted") {
                        await (reg as any).periodicSync.register("check-task-deadlines", {
                            minInterval: 60 * 60 * 1000, // minimum 1 hour
                        });
                    }
                }
            } catch (err) {
                console.error("SW setup failed:", err);
            }
        };

        setup();
    }, []);

    // Mirror tasks to IndexedDB so the service worker can read them when the tab is closed
    useEffect(() => {
        if (!user?.email || tasks.length === 0) return;
        saveTasksToDB(user.email, tasks).catch(console.error);
    }, [tasks, user]);

    // Check deadlines and fire notifications
    useEffect(() => {
        if (!user || tasks.length === 0) return;

        const checkDeadlines = () => {
            if (!("Notification" in window) || Notification.permission !== "granted") return;

            const now = Date.now();

            tasks.forEach((task) => {
                if (!task.date || task.completed) return;

                const deadlineStr = `${task.date}T${task.time || "23:59"}`;
                const deadline = new Date(deadlineStr).getTime();
                const msLeft = deadline - now;
                if (msLeft <= 0) return;

                const hoursLeft = msLeft / (1000 * 60 * 60);
                const daysLeft = hoursLeft / 24;

                // Deadline tomorrow or within today → alert 1 hour before
                // Deadline more than 3 days away → alert 1 day before
                let thresholdHours: number;
                let notifyKey: string;

                if (daysLeft <= 1) {
                    thresholdHours = 1;
                    notifyKey = `${task.id}_1h`;
                } else if (daysLeft > 3) {
                    thresholdHours = 24;
                    notifyKey = `${task.id}_1d`;
                } else {
                    return;
                }

                if (hoursLeft <= thresholdHours && !notifiedRef.current.has(notifyKey)) {
                    notifiedRef.current.add(notifyKey);
                    new Notification("Task Deadline Approaching", {
                        body: `"${task.title}" is due in less than ${thresholdHours === 1 ? "1 hour" : "24 hours"}!`,
                        icon: "/favicon.ico",
                    });
                }
            });
        };

        checkDeadlines();
        const interval = setInterval(checkDeadlines, 60 * 1000);
        return () => clearInterval(interval);
    }, [tasks, user]);

    const loadTasks = async (email: string) => {
        try {
            const res = await fetch(`/api/tasks?email=${encodeURIComponent(email)}`, { cache: "no-store" });
            const data = await res.json();
            const all: Task[] = data.tasks ?? [];
            allTasksRef.current = all;
            setTasks(all.filter((t) => !t.completed));
        } catch (err) {
            console.error("Error loading tasks:", err);
        }
    };

    const saveAndSync = async (email: string, updatedAll: Task[]) => {
        await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, tasks: updatedAll }),
        });
        window.dispatchEvent(new Event("tasksUpdated"));
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser?.email) loadTasks(currentUser.email);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user?.email) return;
        loadTasks(user.email);
        const onUpdated = () => loadTasks(user.email);
        const onVisible = () => { if (document.visibilityState === "visible") loadTasks(user.email); };
        window.addEventListener("tasksUpdated", onUpdated as EventListener);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            window.removeEventListener("tasksUpdated", onUpdated as EventListener);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [user]);

    const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        setTitleEdit(task.title);
        setDescittionEdit(task.description || "");
        setDateEdit(task.date || "");
        settimeEdit(task.time || "");
        setEditPopup(true);
    };

    const handleDelete = async (id: number) => {
        const updatedAll = allTasksRef.current.filter((t) => t.id !== id);
        allTasksRef.current = updatedAll;
        setTasks(updatedAll.filter((t) => !t.completed));
        await saveAndSync(user.email, updatedAll);
    };

    const handleMarkDone = async (id: number) => {
        const task = allTasksRef.current.find((t) => t.id === id);
        const updatedAll = allTasksRef.current.map((t) =>
            t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        );
        allTasksRef.current = updatedAll;
        setTasks(updatedAll.filter((t) => !t.completed));
        await saveAndSync(user.email, updatedAll);

        if (task?.date && "Notification" in window && Notification.permission === "granted") {
            const deadline = new Date(`${task.date}T${task.time || "23:59"}`).getTime();
            if (deadline > Date.now()) {
                new Notification("Task Completed Early!", {
                    body: `Great job! You finished "${task.title}" before the deadline.`,
                    icon: "/Webicon.png",
                });
            }
        }
    };

    const handleUpdate = async (id: number) => {
        const updatedAll = allTasksRef.current.map((t) =>
            t.id === id
                ? { ...t, title: titledit, description: descritionedit, date: dateedit, time: timeedit }
                : t
        );
        allTasksRef.current = updatedAll;
        setTasks(updatedAll.filter((t) => !t.completed));
        setEditPopup(false);
        await saveAndSync(user.email, updatedAll);
    };

    return (
        <div className="max-h-[100vh] p-4 sm:p-7 max-w-full hide-scrollbar mx-auto font-serif border-0 border-amber-400 relative overflow-y-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-2 text-center text-amber-500 ">
                {t.tasks.yourTaskList}
            </h1>
            <hr className="bg-amber-400 text-amber-600 w-[96%] mb-5"></hr>

            {editPopup && selectedTask && (
                <div className="fixed top-0 z-10 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-md w-96 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Update Task</h2>
                        <input
                            type="text"
                            placeholder={t.tasks.title}
                            value={titledit}
                            onChange={(e) => setTitleEdit(e.target.value)}
                            className="border p-2 w-full mb-2"
                        />
                        <textarea
                            placeholder={t.tasks.description}
                            value={descritionedit}
                            onChange={(e) => setDescittionEdit(e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-3 rounded-lg bg-white dark:bg-gray-700/50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 resize-none"
                        />
                        <input
                            type="date"
                            value={dateedit}
                            onChange={(e) => setDateEdit(e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-3 rounded-lg bg-white dark:bg-gray-700/50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                        />
                        <input
                            type="time"
                            value={timeedit}
                            onChange={(e) => settimeEdit(e.target.value)}
                            className="border border-gray-300 dark:border-gray-600 p-2 w-full mb-5 rounded-lg bg-white dark:bg-gray-700/50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditPopup(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedTask.id)}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium shadow-sm"
                            >
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tasks.length === 0 ? (
                <p className="text-center text-gray-400 mt-10">{t.tasks.noTasks}</p>
            ) : (
                <ul data-aos="zoom-in-up" className="space-y-4 md:mx-auto md:max-w-3xl">
                    {tasks.map((task) => {
                        const urgency = getDeadlineUrgency(task.date, task.time);
                        return (
                            <li
                                key={task.id}
                                className={`w-full p-5 sm:p-7 shadow-sm dark:shadow-none rounded-2xl border border-l-4 transition-all duration-300
                                ${urgency === "missed"
                                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-400 dark:border-gray-600 text-gray-500"
                                        : urgency === "critical"
                                            ? "bg-red-50 dark:bg-red-900/20 border-red-500 border-l-red-500 dark:border-red-800"
                                            : urgency === "warning"
                                                ? "bg-orange-50 border-orange-400"
                                                : "bg-white border-amber-400"}`}>
                                <div className="flex items-start gap-2">
                                    <h2 className={`text-lg sm:text-xl font-bold break-words flex-1 min-w-0
                                    ${urgency === "missed" ? "text-gray-400 dark:text-gray-500 line-through" : urgency === "critical" ? "text-red-700 dark:text-red-400" : urgency === "warning" ? "text-orange-600 dark:text-orange-400" : "text-slate-800 dark:text-gray-100"}`}>
                                        {task.title}
                                    </h2>
                                    <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border shrink-0 ${getPriorityColor(task.priority || "")}`}>
                                        {task.priority === "High" ? t.tasks.high : task.priority === "Medium" ? t.tasks.medium : task.priority === "Low" ? t.tasks.low : task.priority}
                                    </span>
                                </div>
                                <p className={`mt-2 break-words whitespace-normal
                                ${urgency === "missed" ? "text-gray-400" : urgency === "critical" ? "text-red-500" : urgency === "warning" ? "text-orange-500" : "text-gray-600"}`}>
                                    {task.description}
                                </p>
                                {urgency === "missed" && (
                                    <p className="mt-1 text-sm font-semibold text-red-500 tracking-wide">⚠ Missed</p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <p className={`text-sm ${urgency === "missed" ? "text-gray-300" : urgency === "critical" ? "text-red-400" : urgency === "warning" ? "text-orange-400" : "text-gray-400"}`}>
                                        📅 Due Date:{" "}
                                        <span className={`font-medium font-sans ${urgency === "missed" ? "text-gray-400" : urgency === "critical" ? "text-red-600" : urgency === "warning" ? "text-orange-600" : "text-gray-700"}`}>
                                            {task.date}
                                        </span>
                                    </p>
                                    <p className="flex text-sm border-l-2 pl-3">
                                        Time: <span className="text-sm font-sans ml-1">{task.time}</span>
                                    </p>
                                    <div className="ml-auto flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(task)}
                                            className="cursor-pointer px-3 py-1 bg-sky-500 text-white rounded-md hover:bg-sky-600">{t.update}</button>
                                        <button
                                            onClick={() => handleMarkDone(task.id)}
                                            className="cursor-pointer px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600">{t.done}</button>
                                        <ConfirmDeleteButton
                                            itemName={task.title}
                                            itemId={task.id}
                                            onDelete={(id) => handleDelete(id as number)}
                                        />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
