"use client";
import AddTasks from "../../component/addtasks";
import Footer from "../../component/Footer";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();

  }, []);
  return (
    <>
      <div className="bg-white sm:w-full w-full flex flex-col justify-center overflow-x-hidden">
        <div className="min-h-screen border-0 border-amber-300  sm:py-4 sm:w-[auto] flex flex-col
         lg:flex-row justify-center gap-2 lg:gap-2 md:w-auto md:flex md:justify-center dark:text-white
         md:ml-36 ">
          <div
            data-aos="fade-down-right"
            className="w-full max-w-xl flex flex-col gap-2 border-0 border-red-500">
            <h1 className=" dark:text-white text-2xl sm:text-4xl font-serif font-bold text-center textanimated">
              <p className=" text-2xl mb-5">Hi <span className="text-5xl">{user?.email?.split('@')[0] || "Guest"}</span>
              </p>Welcome To TODOLIFE </h1>
            <h1 className="font-serif text-center text-base sm:text-lg">TODOLIFE will make your tasks done easier</h1>
          </div>
          <AddTasks />
        </div>
        <Footer />
      </div>
    </>
  );
}
