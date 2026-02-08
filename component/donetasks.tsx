"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase"
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteitems";
interface Task {
  id: number;
  title: string;
  description?: string;
  date?: string;
  priority?: string;
  time?: string;
  type?: string;
  completed?: boolean;
  completedAt?: string | null;
}
const formatCompletedAt = (iso?: string | null) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  try {
    return d.toLocaleString();
  } catch {
    return d.toISOString();
  }
};

export default function DonePage() {
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [showtype, setShowType] = useState(false);
  const [typework, setTypeWork] = useState(false);
  const [selectedType, setSelectedType] = useState<"work" | "study" | "activities">("work");
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
      if (currentUser) {
        // Load user-specific tasks from localStorage
        const storedTasks = localStorage.getItem(`tasks_${currentUser.email}`);
        setDoneTasks(storedTasks ? JSON.parse(storedTasks) : []);
      }
    });
    return () => unsubscribe();
  }, []);
  const handleTypeToggle = () => setShowType((s) => !s);
  const chooseType = (t: "work" | "study" | "activities") => {
    setSelectedType(t);
    setShowType(false); // close mobile menu after choice
  };

  const handleDelete = (id: number) => {
    if (!user?.email) return;
    try {
      const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
      const updatedTasks = storedTasks.filter((t: Task) => t.id !== id);
      localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasksUpdated"));
      }
      const completedOnly = updatedTasks.filter((t: Task) => t.completed);
      completedOnly.sort((a, b) => {
        const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return tb - ta;
      });
      setDoneTasks(completedOnly);
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  const handleClearAll = () => {
    if (!user?.email) return;
    if (!window.confirm("Delete all completed tasks? This cannot be undone.")) return;
    try {
      const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
      const updatedTasks = storedTasks.filter((t: Task) => !t.completed);
      localStorage.setItem(`tasks_${user.email}`, JSON.stringify(updatedTasks));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasksUpdated"));
      }
      setDoneTasks([]);
    } catch (e) {
      console.error("Failed to clear completed tasks", e);
    }
  };

  useEffect(() => {
    if (loadingUser) return;
    if (loadingUser || !user?.email) return;

    const load = () => {
      if (user) {
        const storedTasks: Task[] = JSON.parse(localStorage.getItem(`tasks_${user.email}`) || "[]");
        const completedOnly = storedTasks.filter((t: Task) => t.completed);
        // sort by most recently completed first
        completedOnly.sort((a, b) => {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return tb - ta;

        });
        setDoneTasks(completedOnly);
      } else {
        alert("Please sign up or login");
      }

    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ("tasks")) load();
    };
    const onUpdated = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("tasksUpdated", onUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tasksUpdated", onUpdated as EventListener);
    };
  }, [user, loadingUser]);


  return (
    <div className="w-full max-h-[100%] overflow-y-auto font-serif sm:border-0
     border-red-900 relative bg-sky-950 flex flex-col sm:ml-44 ">
      <div className="flex flex-wrap sm:items-center sm:flex-col justify-between gap-3 mb-5 sm:flex sm:justify-center 
                border-0 border-amber-700 sm:p-4 p-4 ">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-600">✅ Completed Tasks</h1>
        {doneTasks.length > 0 && (
          <button
            onClick={handleClearAll}
            className="cursor-pointer px-3 sm:px-4 py-2 rounded-md bg-red-600 text-white font-semibold
             hover:bg-red-700 shadow"
          >
            Clear All
          </button>
        )}
        <div className="sm:hidden ">
          <button
            onClick={handleTypeToggle}
            className="px-3 py-1 rounded-md bg-slate-200 "
          >
            Choose type
          </button>
          {showtype && (
            <div className=" absolute ml-2 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50">
              <ul>
                <li>
                  <button
                    onClick={() => chooseType("work")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">work</button>
                </li>
                <li>
                  <button
                    onClick={() => chooseType("study")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">study</button>
                </li>
                <li>
                  <button
                    onClick={() => chooseType("activities")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">activities</button>
                </li>
              </ul>
            </div>
          )}
        </div>


        < hr className="mb-3 text-amber-300 mx-15 "></hr>
        <div className="flex border-0 w-full border-blue-900 ">
          {doneTasks.length === 0 ? (
            <p className="sm:text-center text-gray-500 w-full text-center">No completed tasks yet.</p>
          ) : (
            <section className="flex justify-center border-0 border-fuchsia-600 w-full gap-1">
              {!typework &&
                <div className={` ${(selectedType !== "work") ? "hidden" : "block"} sm:block border-0 border-amber-400   sm:w-full   w-full flex 
                  flex-col gap-0 sm:gap-0 px-2 `}>
                  <h1 className="text-white m-0 text-center font-bold text-shadow-md text-shadow-amber-600">Work Tasks</h1>
                  <p className="text-end text-white  text-xl m-0 bg-orange-400 rounded-t-md">
                    <label className="text-sm ">tasks: </label><span className="mr-3 font-bold">
                      {doneTasks.filter(t => (t.type) === "work").length}</span></p>
                  {doneTasks.filter(t => (t.type) === "work").length === 0 ? <p className="text-center text-white">No completed work tasks yet.</p> :
                    <ul className="w-full border-0 border-amber-500 h-[500px] overflow-y-auto p-2  bg-gray-500 hide-scrollbar flex gap-2 flex-col">
                      {doneTasks
                        .filter(t => (t.type) === "work")
                        .map((task, index) => (
                          <li key={task.id} className="p-5 sm:p-6 bg-white shadow-md rounded-xl 
                                 border-l-4 border-green-400 break-words">
                            <div className="flex items-start gap-2">
                              <h2 className="text-lg font-bold text-gray-800 break-words flex-1 min-w-0">{task.title}</h2>
                              {task.priority && (
                                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border bg-green-100 text-green-600 border-green-400 shrink-0">
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-gray-600 mt-1 break-words whitespace-normal">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-3">
                              {task.date && (
                                <span>
                                  📅 Due Date: <span className="text-gray-700 font-medium font-sans">{task.date}</span>
                                </span>
                              )}
                              {task.time && (
                                <span className="border-l-2 pl-2">
                                  ⏰ Time: <span className="text-gray-700 font-medium font-sans">{task.time}</span>
                                </span>
                              )}

                            </div>
                            <p className="text-sm text-gray-400 mt-2">
                              ✅ Done at: <span className="text-gray-700 font-medium font-sans">{formatCompletedAt(task.completedAt)}</span>
                            </p>
                            <div className="float-end">
                              <ConfirmDeleteButton
                                itemId={task.id}
                                itemName={user ? task.title : task.title}
                                onDelete={() => { handleDelete(task.id); }}
                              />
                            </div>
                          </li>
                        ))}
                    </ul>}
                </div>
              }
              { }

              <div className={`${(selectedType !== "study") ? "hidden" : "block"} sm:block sm:w-full  border-0 border-amber-400  w-fit flex flex-col gap-0 sm:gap-0 px-2`}>
                <h1 className="text-white m-0 text-center font-bold text-shadow-md text-shadow-amber-600">study tasks</h1>
                <p className="text-white text-end font-bold text-xl m-0  rounded-t-md bg-orange-400"><label className="text-sm">tasks: </label><span className="mr-3">{doneTasks.filter(t => (t.type) === "study").length}</span></p>
                {doneTasks.filter(t => (t.type) === "study").length === 0 ? <p className="text-center text-white">No completed activity tasks yet.</p> :
                  <ul className="w-full sm:gap-2 h-[500px] overflow-y-auto hide-scrollbar bg-gray-500 p-2 flex flex-col gap-2" >
                    {doneTasks

                      .filter(t => (t.type) === "study")
                      .map((task, index) => (
                        <li key={task.id} className="p-5 sm:p-6 bg-white shadow-md rounded-xl 
                                 border-l-4 border-green-400 break-words">
                          <div className="flex items-start gap-2">
                            <h2 className="text-lg font-bold text-gray-800 break-words flex-1 min-w-0">{task.title}</h2>
                            {task.priority && (
                              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border bg-green-100 text-green-600 border-green-400 shrink-0">
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-gray-600 mt-1 break-words whitespace-normal">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-3">
                            {task.date && (
                              <span>
                                📅 Due Date: <span className="text-gray-700 font-medium font-sans">{task.date}</span>
                              </span>
                            )}
                            {task.time && (
                              <span className="border-l-2 pl-2">
                                ⏰ Time: <span className="text-gray-700 font-medium font-sans">{task.time}</span>
                              </span>
                            )}

                          </div>
                          <p className="text-sm text-gray-400 mt-2">
                            ✅ Done at: <span className="text-gray-700 font-medium font-sans">{formatCompletedAt(task.completedAt)}</span>
                          </p>
                          <div className="float-end">
                            <ConfirmDeleteButton
                              itemId={task.id}
                              itemName={user ? task.title : task.title}
                              onDelete={() => { handleDelete(task.id); }}
                            />
                          </div>
                        </li>
                      ))}
                  </ul>}
              </div>

              <div className={`${(selectedType !== "activities") ? "hidden" : "block"} sm:block border-0 border-amber-400   sm:w-full  w-full flex flex-col gap-0 sm:gap-0 px-2`}>
                <h1 className="text-white m-0 text-center font-bold text-shadow-md text-shadow-amber-600">Activities Tasks</h1>
                <p className="text-end text-white  text-xl m-0 bg-orange-400 rounded-t-md">
                  <label className="text-sm ">tasks: </label><span className="mr-3 font-bold">
                    {doneTasks.filter(t => (t.type) === "activities").length}</span></p>
                {doneTasks.filter(t => (t.type) === "activities").length === 0 ? <p className="text-center text-white">No completed activity tasks yet.</p> :
                  <ul className="w-full sm:gap-2 h-125 overflow-y-auto hide-scrollbar bg-gray-500 p-2 flex flex-col gap-2">
                    {doneTasks
                      .filter(t => (t.type) === "activities")
                      .map((task, index) => (
                        <li key={task.id} className="p-5 sm:p-6 bg-white shadow-md rounded-xl 
                                 border-l-4 border-green-400 break-words">
                          <div className="flex items-start gap-2">
                            <h2 className="text-lg font-bold text-gray-800 break-words flex-1 min-w-0">{task.title}</h2>
                            {task.priority && (
                              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border bg-green-100 text-green-600 border-green-400 shrink-0">
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-gray-600 mt-1 break-words whitespace-normal">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-3">
                            {task.date && (
                              <span>
                                📅 Due Date: <span className="text-gray-700 font-medium font-sans">{task.date}</span>
                              </span>
                            )}
                            {task.time && (
                              <span className="border-l-2 pl-2">
                                ⏰ Time: <span className="text-gray-700 font-medium font-sans">{task.time}</span>
                              </span>
                            )}

                          </div>
                          <p className="text-sm text-gray-400 mt-2">
                            ✅ Done at: <span className="text-gray-700 font-medium font-sans">{formatCompletedAt(task.completedAt)}</span>
                          </p>
                          <div className="float-end">
                            <ConfirmDeleteButton
                              itemId={task.id}
                              itemName={user ? task.title : task.title}
                              onDelete={() => { handleDelete(task.id); }}
                            />
                          </div>
                        </li>
                      ))}
                  </ul>
                }
              </div>

            </section>
          )
          }
        </div>
      </div >
    </div >
  );
}
