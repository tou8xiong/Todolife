import type { Metadata } from "next";
import ListsPage from "@/components/tasks/TaskList"

export const metadata: Metadata = {
    title: "My Tasks",
    description: "View and manage all your pending tasks. Mark tasks as done, edit details, and stay on top of your deadlines with TodoLife.",
};

export default function MyTasks() {
    return (
        <div
            className="min-h-screen border-0 border-amber-300 font-serif text-base
         sm:text-lg bg-linear-to-b from-gray-900 to-gray-600 px-3 sm:px-6 py-4">
            <ListsPage />
        </div>
    )

}