"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import AlertDialog from "@/components/ui/AlertDialog";
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
        <div className="sm:flex  sm:justify-center flex justify-center w-full relative">

            {/* Loading Overlay */}
            {saving && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white font-medium animate-pulse">Saving task...</p>
                    </div>
                </div>
            )}

            <AlertDialog
                open={alertOpen}
                title="Invalid Deadline"
                message="The date and time you selected is already in the past. Please choose a future date and time."
                onClose={() => setAlertOpen(false)}
            />
            <div className="sm:w-[700px] w-full mx-1 my-2 max-h-[500px] overflow-y-auto bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">

                {/* Header */}
                <div className="text-center pt-2 pb-1">
                    <h1 className="text-sm font-bold text-white font-serif tracking-tight">
                        Add Task
                    </h1>
                </div>

                <form className="px-3 pb-2 space-y-2">

                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            placeholder="Enter task title..."
                            name="title"
                            autoComplete="off"
                            value={task.title}
                            onChange={handleChange}
                            className={`w-full p-2 rounded-lg bg-gray-700/50 border text-white placeholder-gray-400 focus:outline-none transition-colors ${errors.title ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-amber-400"
                                }`}
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-0.5">{errors.title}</p>}
                    </div>

                    {/* Type & Priority Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="grid grid-cols-3 gap-1">
                                {[
                                    { value: "work", label: "W", icon: Briefcase, color: "blue" },
                                    { value: "study", label: "S", icon: BookOpen, color: "violet" },
                                    { value: "activities", label: "A", icon: Zap, color: "amber" },
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
                                            onClick={() => { setTask(p => ({ ...p, type: value })); setErrors(p => ({ ...p, type: undefined })); }}
                                            className={`flex items-center justify-center py-1.5 rounded-lg border text-xs transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
                                        >
                                            <Icon size={14} />
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.type && <p className="text-red-400 text-xs mt-0.5">{errors.type}</p>}
                        </div>
                        <div>
                            <div className="grid grid-cols-3 gap-1">
                                {[
                                    { value: "high", label: "H", color: "red" },
                                    { value: "medium", label: "M", color: "orange" },
                                    { value: "low", label: "L", color: "green" },
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
                                            onClick={() => { setTask(p => ({ ...p, priority: value })); setErrors(p => ({ ...p, priority: undefined })); }}
                                            className={`py-1.5 rounded-lg border text-xs font-medium transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.priority && <p className="text-red-400 text-xs mt-0.5">{errors.priority}</p>}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <input
                                value={task.date}
                                onChange={handleChange}
                                type="date"
                                name="date"
                                className={`w-full p-2 rounded-lg bg-gray-700/50 border text-white focus:outline-none transition-colors ${errors.date ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-amber-400"
                                    }`}
                            />
                            {errors.date && <p className="text-red-400 text-xs mt-0.5">{errors.date}</p>}
                        </div>
                        <div>
                            <input
                                value={task.time}
                                type="time"
                                name="time"
                                onChange={handleChange}
                                className={`w-full p-2 rounded-lg bg-gray-700/50 border text-white focus:outline-none transition-colors ${errors.time ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-amber-400"
                                    }`}
                            />
                            {errors.time && <p className="text-red-400 text-xs mt-0.5">{errors.time}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <textarea
                            name="description"
                            value={task.description}
                            onChange={handleChange}
                            placeholder="Description (optional)..."
                            rows={1}
                            className="w-full p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold transition-all border border-gray-600"
                        >
                            <X size={14} /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all shadow-md shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Check size={14} /> Save Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
