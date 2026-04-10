import type { Metadata } from "next";
import AddTasks from "@/components/tasks/AddTasks"

export const metadata: Metadata = {
  title: "New Task",
  description: "Create a new task in TodoLife. Set a title, type, priority, deadline, and description to stay organized and on track.",
};

export default function Newtasks() {
    return(
        <div className="sm:w-full w-full min-h-screen bg-gray-900 border-0 border-amber-300
        font-serif text-xl flex justify-center  ">
        <AddTasks />
        </div>
    )
}