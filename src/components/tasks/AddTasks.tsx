"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import AlertDialog from "@/components/ui/AlertDialog";
import { Briefcase, BookOpen, Zap, AlertCircle, Minus, ArrowDown, CalendarDays, Clock } from "lucide-react";

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
        }
    };

    const handleCancel = () => {
        setTask({ title: "", description: "", date: "", time: "", type: "", priority: "" });
        setErrors({});
    };

    return (
        <div className="sm:flex sm:justify-center flex justify-center ">
            <AlertDialog
                open={alertOpen}
                title="Invalid Deadline"
                message="The date and time you selected is already in the past. Please choose a future date and time."
                onClose={() => setAlertOpen(false)}
            />
            <div className="bg-sky-100 dark:bg-gray-900 sm:w-[700px] sm:flex items-center flex-col
               rounded-2xl max-w-full w-full mx-1 my-4 sm:h-[700px] whitespace-nowrap justify-center">
                <h1 data-aos="flip-left"
                    data-aos-easing="ease-out-cubic"
                    data-aos-duration="2000"
                    className="text-center font-bold text-3xl font-serif mt-3 text-shadow-sm dark:text-white text-shadow-violet-500" >Add Tasks</h1>
                <form
                    data-aos="zoom-out-up"
                    className="sm:rounded-xl rounded px-2 sm:flex sm:items-center w-full text-black sm:flex-col sm:border-2
                border-2 border-amber-300
                sm:m-1 bg-sky-50 sm:w-[590px]  sm:gap-7 sm:shadow-lg shadow-stone-500
                  flex  justify-center items-center flex-col">

                    {/* Title */}
                    <div className=" sm:flex sm:justify-around sm:flex-row sm:w-full sm:gap-1  text-black sm:mt-3
                                 flex flex-wrap flex-col justify-center items-center w-full gap-2 mt-2 border-0 border-amber-950">
                        <span className="sm:text-xl font-serif sm:border-0 border-amber-300 w-full sm:w-[200px] sm:text-center">Tasks Title :</span>
                        <div className="sm:w-[300px] w-full">
                            <input
                                type="text"
                                placeholder="title"
                                name="title"
                                value={task.title}
                                onChange={handleChange}
                                className={`font-[20px] font-serif w-full border-2 rounded-sm text-xl p-1 mr-2 ${errors.title ? "border-red-400 bg-red-50" : "border-gray-400"}`}>
                            </input>
                            {errors.title && <p className="text-red-500 text-xs mt-0.5">{errors.title}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="border-0  text-black w-full border-gray-950 sm:flex sm:justify-around sm:flex-row sm:w-full sm:gap-1
                flex flex-wrap justify-center items-center">
                        <span className="text-xl font-serif border-0 border-amber-300 sm:w-[300px] w-full text-center ">Description :</span>
                        <textarea
                            name="description"
                            value={task.description}
                            onChange={handleChange}
                            placeholder="Tasks Detail"
                            className=" font-[20px] font-serif sm:w-[310px] w-full border-2
                     border-gray-400 rounded-sm text-xl p-1 mr-2 flex flex-wrap">
                        </textarea>
                    </div>

                    {/* Type */}
                    <div className="sm:flex sm:justify-center sm:font-serif sm:text-sm sm:p-0 sm:text-md sm:gap-2 w-full px-2">
                        {/* mobile pill buttons */}
                        <div className="sm:hidden">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Type</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: "work", label: "Work", icon: <Briefcase size={13} />, active: "bg-amber-100 text-amber-700 border-amber-300" },
                                    { value: "study", label: "Study", icon: <BookOpen size={13} />, active: "bg-blue-100 text-blue-700 border-blue-300" },
                                    { value: "activities", label: "Activities", icon: <Zap size={13} />, active: "bg-purple-100 text-purple-700 border-purple-300" },
                                ].map(({ value, label, icon, active }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => { setTask(p => ({ ...p, type: value })); setErrors(p => ({ ...p, type: undefined })); }}
                                        className={`flex items-center justify-center gap-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${task.type === value ? active : "border-gray-200 text-gray-400 bg-white"}`}
                                    >
                                        {icon}{label}
                                    </button>
                                ))}
                            </div>
                            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                        </div>
                        {/* desktop selects (original) */}
                        <div className="hidden sm:flex sm:items-center sm:justify-center sm:gap-2 sm:w-full">
                            <span>Types :</span>
                            <div className="flex flex-col">
                                <select name="type" value={task.type} onChange={handleChange}
                                    className={`sm:p-2 p-1.5 rounded-md border-2 ${errors.type ? "border-red-400 bg-red-50" : "bg-amber-200 border-gray-500"}`}>
                                    <option value="">pick type</option>
                                    <option value="work">Work</option>
                                    <option value="study">Study</option>
                                    <option value="activities">Activities</option>
                                </select>
                                {errors.type && <p className="text-red-500 text-xs mt-0.5">{errors.type}</p>}
                            </div>
                            <span>Priority :</span>
                            <div className="flex flex-col">
                                <select name="priority" value={task.priority} onChange={handleChange}
                                    className={`sm:p-2 p-1.5 rounded-md border-2 ${errors.priority ? "border-red-400 bg-red-50" : "bg-cyan-200 border-gray-500"}`}>
                                    <option value="">pick priority</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                {errors.priority && <p className="text-red-500 text-xs mt-0.5">{errors.priority}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Priority — mobile only */}
                    <div className="sm:hidden w-full px-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Priority</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "high", label: "High", icon: <AlertCircle size={13} />, active: "bg-red-100 text-red-600 border-red-300" },
                                { value: "medium", label: "Medium", icon: <Minus size={13} />, active: "bg-orange-100 text-orange-600 border-orange-300" },
                                { value: "low", label: "Low", icon: <ArrowDown size={13} />, active: "bg-green-100 text-green-700 border-green-300" },
                            ].map(({ value, label, icon, active }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => { setTask(p => ({ ...p, priority: value })); setErrors(p => ({ ...p, priority: undefined })); }}
                                    className={`flex items-center justify-center gap-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${task.priority === value ? active : "border-gray-200 text-gray-400 bg-white"}`}
                                >
                                    {icon}{label}
                                </button>
                            ))}
                        </div>
                        {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
                    </div>

                    {/* Date & Time */}
                    <div className="sm:flex sm:justify-center w-full px-2">
                        {/* mobile: side-by-side grid */}
                        <div className="sm:hidden grid grid-cols-2 gap-3 w-full">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                    <CalendarDays size={11} />Date
                                </p>
                                <input value={task.date} onChange={handleChange} type="date" name="date"
                                    className={`block w-full rounded-xl border-2 p-2 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 ${errors.date ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                    <Clock size={11} />Time
                                </p>
                                <input value={task.time} type="time" name="time" onChange={handleChange}
                                    className={`block w-full rounded-xl border-2 p-2 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 ${errors.time ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                                {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                            </div>
                        </div>
                        {/* desktop: original layout */}
                        <div className="hidden sm:flex sm:gap-4 sm:justify-center sm:w-full">
                            <div>
                                <span>Date</span>
                                <input value={task.date} onChange={handleChange} type="date" name="date"
                                    className={`block w-full rounded-lg border-2 sm:p-3 p-1.5 font-sans ${errors.date ? "border-red-400 bg-red-50" : "border-gray-500"}`} />
                                {errors.date && <p className="text-red-500 text-xs mt-0.5">{errors.date}</p>}
                            </div>
                            <div>
                                <span>Time</span>
                                <input value={task.time} type="time" name="time" onChange={handleChange}
                                    className={`block w-full rounded-lg text-black border-2 sm:p-3 p-1.5 font-sans ${errors.time ? "border-red-400 bg-red-50" : "border-gray-500"}`} />
                                {errors.time && <p className="text-red-500 text-xs mt-0.5">{errors.time}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="sm:flex mt-7 sm:gap-45 sm:font-serif sm:mt-[20px] sm:mb-[70px] flex gap-10 justify-center mb-3">
                        <button type="button" onClick={handleCancel} className="px-7 py-2 rounded-lg bg-slate-400 text-white font-semibold hover:bg-slate-500">chancel</button>
                        <button type="button" onClick={handleAdd} className="px-11 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">save</button>
                    </div>
                </form >
            </div >
        </div>
    )
}
