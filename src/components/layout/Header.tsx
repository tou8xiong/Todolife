"use client";
import Image from "next/image";
import Logo from "@/public/Logo1.png";
import Link from "next/link";
import { useTaskCounts } from "@/hooks/useTaskCounts";
import { useState, useEffect } from "react";
import { FaList } from "react-icons/fa";
import { MdDashboard, MdTimer } from "react-icons/md";
import { GiNotebook } from "react-icons/gi";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
    const { pending, completed } = useTaskCounts();
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hideform, setHideForm] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userEmoji, setUserEmoji] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setHideForm(!currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const loadEmoji = () => {
            const saved = localStorage.getItem("emoji");
            setUserEmoji(saved);
        };
        loadEmoji();
        window.addEventListener("storage", loadEmoji);
        return () => window.removeEventListener("storage", loadEmoji);
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setShowProfileMenu(false);
    };

    const username = user?.displayName || user?.email?.split('@')[0] || "Guest";

    return (
        <div className="bg-blue-300  sm:flex flex-wrap sm:items-center w-full  sm:w-full
         justify-between sm:justify-between sm:gap-2 sticky top-0 z-50 shadow-sm sm:shadow-sm shadow-black sm:border-0
          border-red-400  sm:px-0 py-2 max-w-full border-0 m-0">
            <button data-aos="flip-left" className="m-1 cursor-pointer"><Link href={"/"}>
                <Image src={Logo} alt="logo" className="w-32 sm:w-48 md:w-[250px]" /></Link>
            </button>
            <div className="flex flex-wrap gap-2 justify-around sm:items-center sm:gap-6
              font-serif   border-0 border-fuchsia-600  ">
                <button
                    className="sm:hover:bg-amber-100 sm:p-2 p-2 sm:rounded-xl sm:px-3 sm:border-0 border-2 rounded-xl border-sky-600">
                    <Link href={"/newtasks"} className="sm:text-lg text-[12px] ">New Tasks</Link>
                </button>
                <button
                    className="hover:bg-amber-100 p-2 rounded-xl  sm:px-6 flex items-center sm:border-0 border-2 border-sky-600">
                    <Link href={"/mytasks"} className="sm:text-lg text-[12px] ">My Tasks</Link>
                    <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-slate-800 text-white">{pending}</span>
                </button>
                <button
                    className="hover:bg-amber-100 p-2 rounded-xl  sm:px-6 flex items-center sm:border-0 border-2 border-sky-600">
                    <Link href={"/completetasks"} className="sm:text-lg text-[12px] ">Complete Tasks</Link>
                    <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-green-700
                     text-white">{user ? completed : "0"}</span>
                </button>
            </div>
            <div className="sm:flex flex justify-between md:flex md:justify-between sm:justify-between">
                <div className=" flex items-center w-fit">
                    <div className="border-0 border-amber-400 w-fit md:hidden font-serif h-full ">
                        <button onClick={() => setShowMenu(!showMenu)}
                            className=" md:hidden ml-5 rounded hover:bg-gray-500 mt-2"><FaList size={26} /></button>
                        {showMenu &&
                            <div className="md:hidden absolute mt-1 ml-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50">
                                <ul className="p-2 flex flex-col gap-1 font-serif">
                                    <li><a href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors"><MdDashboard size={16} className="text-amber-400 shrink-0" />Dashboard</a></li>
                                    <li><a href="/settimepage" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors"><MdTimer size={16} className="text-amber-400 shrink-0" />Set Timer</a></li>
                                    <li><a href="/noteidea" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 transition-colors"><GiNotebook size={16} className="text-amber-400 shrink-0" />Idea Notes</a></li>
                                </ul>
                            </div>}
                    </div>
                </div>
                <div className="sm:p-2 flex sm:gap-2 sm:flex sm:w-[auto] w-fit ml-auto sm:m-0 border-0 border-amber-700 mt-2">
                    {hideform ? (
                        <div className="sm:m-0 ml-auto sm:gap-3">
                            <button
                                className=" px-4 sm:px-7 py-2 rounded-md font-serif text-sm sm:text-lg bg-amber-100 hover:bg-amber-200 shadow-lg">
                                <Link href={"/formlogin"}>Log in </Link>
                            </button>
                            <button className="mx-3 px-4 sm:px-7 py-2 rounded-md font-serif text-sm sm:text-lg bg-green-300 hover:bg-green-400 shadow-xl">
                                <Link href={"/formsignup"}> Sign up</Link>
                            </button>
                        </div>
                    ) : (
                        <div className="relative ml-auto">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="cursor-pointer flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-blue-200 transition"
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-amber-100 shrink-0">
                                    {userEmoji ? (
                                        <Image src={userEmoji} alt="avatar" width={36} height={36} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-base font-bold text-blue-600">
                                            {username[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className="font-bold text-sm hidden sm:block text-gray-800 max-w-[100px] truncate">{username}</span>
                            </button>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <ul className="p-2 flex flex-col gap-1 font-serif text-black">
                                        <li className="p-2 hover:bg-gray-200 rounded-md flex"><Link href="/profile" className="w-full ">Profile</Link>
                                        </li>
                                        <li className="p-2 hover:bg-gray-200 rounded-md cursor-pointer"
                                            onClick={handleLogout}>
                                            Logout
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>)}
                </div>
            </div>
        </div>
    );
}
