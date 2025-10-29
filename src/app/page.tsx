"use client";
import AddTasks from "../../component/addtasks";
import Sidebar from "../../component/sidebar";
import Footer from "../../component/Footer";
import { useTheme } from "next-themes";

export default function Home() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="bg-white dark:bg-gray-900 dark:text-white transition-colors duration-300 ">
      <div className="min-h-screen border-0 border-amber-300  sm:py-4 sm:w-[95%px] flex flex-col lg:flex-row
        sm:justify-center gap-2 lg:gap-2 md:ml-45   dark:text-white">
        <div className="w-full max-w-xl flex flex-col gap-2 border-0 border-red-500">
          <h1 className=" dark:text-white text-2xl sm:text-4xl font-serif font-bold text-center ">Welcome To TODOLIFE </h1>
          <h1 className="font-serif text-center text-base sm:text-lg">TODOLIFE will make your tasks done easier</h1>
        </div>
        <AddTasks />
      </div>
      <Footer />
    </div>
  );
}
