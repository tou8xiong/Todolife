"use client";
import AddTasks from "@/components/tasks/AddTasks";
import Footer from "@/components/layout/Footer";
import { useAppContext } from "@/context/AppContext";

export default function HomeClient() {
  const { user } = useAppContext();
  const username = user?.displayName || user?.email?.split("@")[0] || "Guest";

  return (
    <div className="bg-gray-900 sm:w-full w-full flex flex-col justify-center overflow-x-hidden">
      <div className="min-h-screen border-0 border-amber-300 sm:py-4 w-full flex flex-col lg:flex-row justify-center gap-2 dark:text-white">
        <div
          data-aos="fade-down-right"
          className="w-full max-w-xl flex flex-col gap-2 border-0 border-red-500"
        >
          <h1 className="dark:text-white text-2xl sm:text-4xl font-serif font-bold text-center textanimated">
            <p className="text-2xl mb-5">
              Hi <span className="text-5xl">{username}</span>
            </p>
            Welcome To TODOLIFE
          </h1>
          <h1 className="font-serif text-center text-base sm:text-lg">
            TODOLIFE will make your tasks done easier
          </h1>
        </div>
        <AddTasks />
      </div>
      <Footer />
    </div>
  );
}
