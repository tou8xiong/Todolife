"use client";
import AddTasks from "@/components/tasks/AddTasks";
import Footer from "@/components/layout/Footer";
import { useAppContext } from "@/context/AppContext";

export default function HomeClient() {
  const { user } = useAppContext();
  const username = user?.displayName || user?.email?.split("@")[0] || "Guest";

  return (
    <div className="bg-linear-to-b from-gray-900 to-gray-600 sm:w-full w-full flex flex-col justify-center overflow-x-hidden text-white">
      <div className="min-h-screen sm:py-4 w-full flex flex-col lg:flex-row justify-center gap-2">
        <div
          data-aos="fade-down-right"
          className="w-full max-w-xl flex flex-col gap-2"
        >
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-center">
            <p className="text-2xl mb-5">
              Hi <span className="text-5xl text-amber-400">{username}</span>
            </p>
            Welcome To TODOLIFE
          </h1>
          <h1 className="font-serif text-center text-base sm:text-lg text-gray-200">
            TODOLIFE will make your tasks done easier
          </h1>
        </div>
        <AddTasks />
      </div>
      <Footer />
    </div>
  );
}
