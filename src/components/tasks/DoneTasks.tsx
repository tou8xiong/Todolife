"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import DoneTaskCard from "@/components/ui/DoneTaskCard";

type TaskType = "work" | "study" | "activities";

const TASK_TYPES: { type: TaskType; title: string }[] = [
  { type: "work", title: "Work Tasks" },
  { type: "study", title: "Study Tasks" },
  { type: "activities", title: "Activities Tasks" },
];

interface TaskTypeColumnProps {
  tasks: Task[];
  type: TaskType;
  title: string;
  selectedType: TaskType;
  onDelete: (id: number) => void;
}

function TaskTypeColumn({ tasks, type, title, selectedType, onDelete }: TaskTypeColumnProps) {
  const filtered = tasks.filter((t) => t.type === type);
  return (
    <div className={`${selectedType !== type ? "hidden" : "block"} sm:block sm:w-full w-full flex flex-col gap-0 px-2`}>
      <h1 className="text-white m-0 text-center font-bold text-shadow-md text-shadow-amber-600">{title}</h1>
      <p className="text-end text-white text-xl m-0 bg-orange-400 rounded-t-md">
        <label className="text-sm">tasks: </label>
        <span className="mr-3 font-bold">{filtered.length}</span>
      </p>
      {filtered.length === 0 ? (
        <p className="text-center text-white">No completed {type} tasks yet.</p>
      ) : (
        <ul className="w-full h-[500px] overflow-y-auto hide-scrollbar bg-gray-500 p-2">
          {filtered.map((task) => (
            <DoneTaskCard key={task.id} task={task} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DoneTasks() {
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [showtype, setShowType] = useState(false);
  const [selectedType, setSelectedType] = useState<TaskType>("work");
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
      if (currentUser) {
        const storedTasks = localStorage.getItem(`tasks_${currentUser.email}`);
        setDoneTasks(storedTasks ? JSON.parse(storedTasks) : []);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadDoneTasks = (userEmail: string) => {
    const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${userEmail}`) || "[]");
    const completedOnly = storedTasks
      .filter((t) => t.completed)
      .sort((a, b) => {
        const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return tb - ta;
      });
    setDoneTasks(completedOnly);
  };

  useEffect(() => {
    if (loadingUser || !user?.email) return;

    loadDoneTasks(user.email);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "tasks") loadDoneTasks(user.email);
    };
    const onUpdated = () => loadDoneTasks(user.email);

    window.addEventListener("storage", onStorage);
    window.addEventListener("tasksUpdated", onUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tasksUpdated", onUpdated as EventListener);
    };
  }, [user, loadingUser]);

  const handleDelete = (id: number) => {
    if (!user?.email) return;
    try {
      const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
      const updatedTasks = storedTasks.filter((t) => t.id !== id);
      localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasksUpdated"));
      }
      loadDoneTasks(user.email);
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  const handleClearAll = () => {
    if (!user?.email) return;
    if (!window.confirm("Delete all completed tasks? This cannot be undone.")) return;
    try {
      const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
      const updatedTasks = storedTasks.filter((t) => !t.completed);
      localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasksUpdated"));
      }
      setDoneTasks([]);
    } catch (e) {
      console.error("Failed to clear completed tasks", e);
    }
  };

  const chooseType = (t: TaskType) => {
    setSelectedType(t);
    setShowType(false);
  };

  return (
    <div className="w-full max-h-[100%] overflow-y-auto font-serif sm:border-0
     border-red-900 relative bg-sky-950 flex flex-col sm:ml-44 ">
      <div className="flex flex-wrap sm:items-center sm:flex-col justify-between gap-3 mb-5 sm:flex sm:justify-center
                border-0 border-amber-700 sm:p-4 p-4 ">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-600">✅ Completed Tasks</h1>

        {doneTasks.length > 0 && (
          <button
            onClick={handleClearAll}
            className="cursor-pointer px-3 sm:px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 shadow"
          >
            Clear All
          </button>
        )}

        <div className="sm:hidden">
          <button
            onClick={() => setShowType((s) => !s)}
            className="px-3 py-1 rounded-md bg-slate-200"
          >
            Choose type
          </button>
          {showtype && (
            <div className="absolute ml-2 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
              <ul>
                {TASK_TYPES.map(({ type }) => (
                  <li key={type}>
                    <button
                      onClick={() => chooseType(type)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {type}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <hr className="mb-3 text-amber-300 mx-15"></hr>
        <div className="flex border-0 w-full border-blue-900">
          {doneTasks.length === 0 ? (
            <p className="sm:text-center text-gray-500 w-full text-center">No completed tasks yet.</p>
          ) : (
            <section className="flex justify-center border-0 border-fuchsia-600 w-full gap-1">
              {TASK_TYPES.map(({ type, title }) => (
                <TaskTypeColumn
                  key={type}
                  tasks={doneTasks}
                  type={type}
                  title={title}
                  selectedType={selectedType}
                  onDelete={handleDelete}
                />
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
