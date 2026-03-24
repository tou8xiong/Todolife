"use client";
import Image from "next/image";
import Logo from "../public/Logo1.png";
import Link from "next/link";
import { useTaskCounts } from "./useTaskCounts";
import { useState, useEffect } from "react";
import { FaList } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";


export default function Header() {
    const { pending, completed } = useTaskCounts();
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [hideform, setHideForm] = useState(true);
    const [userEmoji, serUserEmoji] = useState<string | null>(null);

    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setHideForm(!currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setShowProfileMenu(false); // Close menu on logout
    };

    useEffect(() => {
        pending;
    }, [pending])

    useEffect(() => {
        const useremoji = localStorage.getItem("emoji");
        if (useremoji) {
            serUserEmoji(useremoji);
        }

    }, [userEmoji])
    console.log("header checkl", userEmoji)


    return (
        <div className="bg-blue-300  sm:flex flex-wrap sm:items-center w-full  sm:w-full
         justify-between sm:justify-between sm:gap-2 sticky top-0 z-50 shadow-sm sm:shadow-sm shadow-black sm:border-0
          border-red-400  sm:px-0  max-w-full border-0 m-0">
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
                    <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-slate-800 text-white">
                        {pending}</span>
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
                            <div className="md:hidden border-none  absolute mt-0  ml-2 w-40 bg-white rounded-sm shadow-lg">
                                <ul className="p-2 flex flex-col gap-1">
                                    <li className="border border-gray-400 rounded p-0.5 active:bg-gray-400"><a href="/settimepage">Timer</a></li>
                                    <li className="border border-gray-400 rounded p-0.5 active:bg-gray-400"><a href="/noteidea">NoteIdea</a></li>
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
                            <div className="flex flex-col  justify-center items-center ">
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="cursor-pointer text-center">
                                    {userEmoji ? (<div><Image src={userEmoji} alt="useremoji" width={50} height={30} /></div>) : (<CgProfile size={32} className="text-center" />)}
                                </button>
                                <label className="text-center font-bold">{user?.displayName || user?.email.split("@")[0]}</label>
                            </div>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <ul className="p-2 flex flex-col gap-1 font-serif text-black">
                                        <li className="p-2 hover:bg-gray-200 rounded-md flex">
                                            <Link href="/profile" className="w-full ">Profile</Link>
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
        </div >
    );
}
