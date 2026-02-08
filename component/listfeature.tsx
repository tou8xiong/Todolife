"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteitems";

interface Task {
    id: number;
    title: string;
    description: string;
    date: string;
    priority: string;
    time: string;
    type?: string;
    completed?: boolean;
    completedAt?: string | null;
}

export default function ListPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [titledit, setTitleEdit] = useState("");
    const [descritionedit, setDescittionEdit] = useState("");
    const [dateedit, setDateEdit] = useState("");
    const [timeedit, settimeEdit] = useState("");
    const [editPopup, setEditPopup] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Load user-specific tasks from localStorage
                const storedTasks = localStorage.getItem(`tasks${currentUser.email}`);
                setTasks(storedTasks ? JSON.parse(storedTasks) : []);
            }
        });
        return () => unsubscribe();
    }, []);


    const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        setTitleEdit(task.title);
        setDescittionEdit(task.description);
        setDateEdit(task.date);
        settimeEdit(task.time);
        setEditPopup(true);
    };
    useEffect(() => {
        if (!user) return;
        try {
            const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
            const pendingTasks = storedTasks.filter((t: Task) => !t.completed);
            setTasks(pendingTasks);
        }
        catch (error) {
            console.error("Error loading tasks:", error);
        }
    }, [user]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High":
                return "bg-red-100 text-red-600 border-red-400";
            case "Medium":
                return "bg-yellow-100 text-yellow-600 border-yellow-400";
            case "Low":
                return "bg-green-100 text-green-600 border-green-400";
            default:
                return "bg-gray-100 text-gray-600 border-gray-400";
        }
    };

    const handleMarkDone = (id: number) => {
        const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
        const updatedTasks = storedTasks.map((t) =>
            t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        );
        localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("tasksUpdated"));
        }
        const pendingTasks = updatedTasks.filter((t) => !t.completed);
        setTasks(pendingTasks);
    };
    const handleUpdate = (id: number) => {
        const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
        const updatedTasks = storedTasks.map((task) =>
            task.id === id
                ? {
                    ...task,
                    title: titledit,
                    description: descritionedit,
                    date: dateedit,
                    time: timeedit,
                }
                : task
        );
        localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
        setTasks(updatedTasks.filter((t) => !t.completed));
        setEditPopup(false);
    };

    const handleDelete = (id: number) => {
        const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
        const updatedTasks = storedTasks.filter((task: any) => task.id !== id);
        localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("tasksUpdated"));
        }
        const pendingTasks = updatedTasks.filter((t: any) => !t.completed);
        setTasks(pendingTasks);
    };


    return (
        <div className="max-h-[100vh] p-4 sm:p-7 max-w-full hide-scrollbar mx-auto font-serif border-0 border-amber-400 relative overflow-y-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-2 text-center text-amber-600 ">
                Your Task List
            </h1>
            <hr className="bg-amber-400 text-amber-600 w-[96%] mb-5"></hr>
            {editPopup && selectedTask && (
                <div className="fixed top-0 z-10 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-md w-96 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Update Task</h2>
                        <input
                            type="text"
                            placeholder="Title"
                            value={titledit}
                            onChange={(e) => setTitleEdit(e.target.value)}
                            className="border p-2 w-full mb-2"
                        />
                        <textarea
                            placeholder="Description"
                            value={descritionedit}
                            onChange={(e) => setDescittionEdit(e.target.value)}
                            className="border p-2 w-full mb-2"
                        />
                        <input
                            type="date"
                            value={dateedit}
                            onChange={(e) => setDateEdit(e.target.value)}
                            className="border p-2 w-full mb-2"
                        />
                        <input
                            type="time"
                            value={timeedit}
                            onChange={(e) => settimeEdit(e.target.value)}
                            className="border p-2 w-full mb-4"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditPopup(false)}
                                className="px-3 py-1 bg-gray-400 text-white rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdate(selectedTask.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {tasks.length === 0 ? (
                <p className="text-center text-gray-500">No tasks yet. Add one!</p>
            ) : (
                <ul data-aos="zoom-in-up" className="space-y-4 md:mx-auto md:max-w-3xl">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className="w-full p-5 sm:p-7 bg-white shadow-md rounded-xl border-l-4 border-amber-400 hover:shadow-xl transition-all duration-200 ">
                            <div className="flex items-start gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words flex-1 min-w-0">{task.title}</h2>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border shrink-0 
                                        ${getPriorityColor(
                                        task.priority
                                    )}`}>
                                    {task.priority}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-2 break-words whitespace-normal">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                <p className="text-sm text-gray-400">
                                    📅 Due Date:{" "}
                                    <span className="text-gray-700 font-medium font-sans">{task.date}</span>
                                </p>

                                <p className="flex text-sm border-l-2 pl-3">
                                    Time: {""}
                                    <span className="text-sm font-sans ml-1">{task.time}</span>
                                </p>
                                <div className="ml-auto flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(task)}
                                        className="cursor-pointer px-3 py-1 bg-sky-500 text-white rounded-md hover:bg-sky-600" >update</button>
                                    <button
                                        onClick={() => handleMarkDone(task.id)}
                                        className="cursor-pointer px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 ">Done</button>
                                    <ConfirmDeleteButton
                                        itemName={user ? task.title : task.title}
                                        itemId={task.id}
                                        onDelete={() =>handleDelete(task.id)}
                                    />

                                    {/**    <button
                                        onClick={() => { handleDelete(task.id); }}
                                        className="cursor-pointer px-3 py-1 bg-red-500
                                         text-white rounded-md hover:bg-red-600 ">Delete</button>*/}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
