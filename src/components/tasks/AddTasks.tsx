"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import AlertDialog from "@/components/ui/AlertDialog";
import { useLanguage } from "@/context/LanguageContext";
import { Briefcase, BookOpen, Zap, CalendarDays, Clock, X, Check } from "lucide-react";

const VALID_TYPES = ["work", "study", "activities"];
const VALID_PRIORITIES = ["high", "medium", "low"];

interface TaskErrors {
    title?: string;
    type?: string;
    priority?: string;
    date?: string;
    time?: string;
}

export default function AddTasks() {
    const { t } = useLanguage();
    const [task, setTask] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        type: "",
        priority: "",
    });
    const [errors, setErrors] = useState<TaskErrors>({});
    const [user, setUser] = useState<any>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTask((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof TaskErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = (): TaskErrors => {
        const newErrors: TaskErrors = {};
        if (!task.title.trim()) newErrors.title = "Task title is required.";
        if (!VALID_TYPES.includes(task.type)) newErrors.type = "Please select a type.";
        if (!VALID_PRIORITIES.includes(task.priority)) newErrors.priority = "Please select a priority.";
        if (!task.date) newErrors.date = "Please pick a date.";
        if (!task.time) newErrors.time = "Please pick a time.";

        if (task.date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(task.date);
            selected.setHours(0, 0, 0, 0);
            if (selected < today) {
                setAlertOpen(true);
                newErrors.date = "Must be a future date.";
            }
        }

        return newErrors;
    };

    const handleAdd = async () => {
        if (!user) {
            toast.error("Please login or signup!");
            return;
        }
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in all required fields.");
            return;
        }

        setSaving(true);
        try {
            const getRes = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`, { cache: "no-store" });
            const getData = await getRes.json();
            const storedTasks = getData.tasks ?? [];
            const updatedTasks = [...storedTasks, { id: Date.now(), ...task }];
            const postRes = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, tasks: updatedTasks }),
            });
            if (!postRes.ok) {
                const err = await postRes.json().catch(() => ({}));
                throw new Error(err.error ?? "Server error");
            }
            window.dispatchEvent(new Event("tasksUpdated"));
            toast.success("Task added!");
            setTask({ title: "", description: "", date: "", time: "", type: "", priority: "" });
            setErrors({});
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to save task. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setTask({ title: "", description: "", date: "", time: "", type: "", priority: "" });
        setErrors({});
    };

    return (
        <div className="sm:flex sm:justify-center flex justify-center w-full relative">

            {saving && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white font-medium animate-pulse">{t.tasks.savingTask}</p>
                    </div>
                </div>
            )}

            <AlertDialog
                open={alertOpen}
                title="Invalid Deadline"
                message="The date and time you selected is already in the past. Please choose a future date and time."
                onClose={() => setAlertOpen(false)}
            />
            <div className="sm:w-[700px] w-full mx-1 min-h-[calc(100vh-220px)] bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 flex flex-col">

                <div className="text-center pt-3 pb-2">
                    <h1 className="text-lg font-bold text-white font-serif tracking-tight">
                        {t.tasks.addNewTask}
                    </h1>
                    <p className="text-gray-300 text-xs mt-0.5">Fill in the details below</p>
                </div>

                <form className="px-4 sm:px-6 pb-4 space-y-3 flex-1">

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{t.tasks.taskTitle}</label>
                        <input
                            type="text"
                            placeholder="Enter task title..."
                            name="title"
                            autoComplete="off"
                            value={task.title}
                            onChange={handleChange}
                            className={`w-full p-2 rounded-lg bg-gray-700/50 border text-white placeholder-gray-500 focus:outline-none transition-colors ${errors.title ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-amber-400"
                                }`}
                        />
                        {errors.title && <p className="text-red-500 dark:text-red-400 text-xs">{errors.title}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Description</label>
                        <textarea
                            name="description"
                            value={task.description}
                            onChange={handleChange}
                            placeholder="Add task details (optional)..."
                            rows={2}
                            className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{t.tasks.taskType}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "work", label: t.tasks.work, icon: Briefcase, color: "blue" },
                                { value: "study", label: t.tasks.study, icon: BookOpen, color: "violet" },
                                { value: "activities", label: t.tasks.activities, icon: Zap, color: "amber" },
                            ].map(({ value, label, icon: Icon, color }) => {
                                const isActive = task.type === value;
                                const colorClasses = {
                                    blue: isActive ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-blue-500/50",
                                    violet: isActive ? "bg-violet-500/20 border-violet-500 text-violet-400" : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-violet-500/50",
                                    amber: isActive ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-amber-500/50",
                                };
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setTask(p => ({ ...p, type: value }))}
                                        className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
                                    >
                                        <Icon size={16} />
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.type && <p className="text-red-500 dark:text-red-400 text-xs">{errors.type}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{t.tasks.priorityLevel}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "high", label: t.tasks.high, color: "red" },
                                { value: "medium", label: t.tasks.medium, color: "orange" },
                                { value: "low", label: t.tasks.low, color: "green" },
                            ].map(({ value, label, color }) => {
                                const isActive = task.priority === value;
                                const colorClasses = {
                                    red: isActive ? "bg-red-500/20 border-red-500 text-red-400" : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-red-500/50",
                                    orange: isActive ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-orange-500/50",
                                    green: isActive ? "bg-green-500/20 border-green-500 text-green-400" : "bg-gray-700/50 border-gray-600 text-gray-400 hover:border-green-500/50",
                                };
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setTask(p => ({ ...p, priority: value }))}
                                        className={`py-2 rounded-lg border text-xs font-medium transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.priority && <p className="text-red-500 dark:text-red-400 text-xs">{errors.priority}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                <CalendarDays size={12} /> {t.tasks.dueDate}
                            </label>
                            <input
                                value={task.date}
                                onChange={handleChange}
                                type="date"
                                name="date"
                                className={`w-full p-2 rounded-lg bg-gray-700/50 border text-white focus:outline-none transition-colors ${errors.date ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-amber-400"
                                    }`}
                            />
                            {errors.date && <p className="text-red-500 dark:text-red-400 text-xs">{errors.date}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-1">
                                <Clock size={12} /> {t.tasks.dueTime}
                            </label>
                            <input
                                value={task.time}
                                type="time"
                                name="time"
                                onChange={handleChange}
                                className={`w-full p-2 rounded-lg bg-gray-700/50 border text-white focus:outline-none transition-colors ${errors.time ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-amber-400"
                                    }`}
                            />
                            {errors.time && <p className="text-red-500 dark:text-red-400 text-xs">{errors.time}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold transition-all border border-gray-600"
                        >
                            <X size={16} /> {t.cancel}
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all shadow-md shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Check size={16} /> {t.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
