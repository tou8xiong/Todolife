
import type { Metadata } from "next";
import DoneTasks from "@/components/tasks/DoneTasks";

export const metadata: Metadata = {
  title: "Completed Tasks",
  description: "Review all your completed tasks sorted by type and completion date. Celebrate your progress with TodoLife.",
};

export default function Completetasks(){
    return(
        <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 font-serif text-base sm:text-lg hide-scrollbar">
            <DoneTasks />
        </div>
    )
}