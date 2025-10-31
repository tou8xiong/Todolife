"use client";
import Image from "next/image";
import Logo from "../public/Logo1.png"
import Link from "next/link";
import { useTaskCounts } from "./useTaskCounts";
import { use, useState } from "react";
import { FaList } from "react-icons/fa";


export default function Header() {
    const { pending, completed } = useTaskCounts();
    const [showMenu, setShowMenu] = useState(false);
    return (
        <div className="bg-blue-300  sm:flex flex-wrap sm:items-center  sm:w-full
         justify-between sm:justify-between sm:gap-2 sticky top-0 z-50 shadow-xl sm:shadow-sm shadow-black sm:border-0
          border-red-400 w-full sm:px-4 py-2 max-w-full">
            <button className="m-1 cursor-pointer"><Link href={"/"}>
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
                    <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-green-700 text-white">{completed}</span>
                </button>
            </div>
            <div className=" flex items-center ">
                <div className="border-0 border-amber-400 w-fit sm:hidden font-serif h-full ">
                    <button onClick={() => setShowMenu(!showMenu)} 
                    className=" sm:hidden ml-5 rounded hover:bg-gray-500 mt-2"><FaList size={26}/></button>
                    {showMenu &&
                        <div className="sm:hidden border-none absolute mt-0 ml-2 w-40 bg-white border rounded-sm shadow-lg">
                            <ul className="p-2 flex flex-col gap-1">
                                <li className="border-1 border-gray-400 rounded p-0.5 active:bg-gray-400"><a href="/settimepage">Timer</a></li>
                                <li className="border-1 border-gray-400 rounded p-0.5 active:bg-gray-400"><a href="#">idea</a></li>
                                <li className="border-1 border-gray-400 rounded p-0.5 active:bg-gray-400"><a href="#">notebook</a></li>
                                <li className="border-1 border-gray-400 rounded p-0.5 active:bg-gray-400"><a href="#">fgsf</a></li>
                            </ul>
                        </div>}
                </div>
                <div className="sm:p-2 flex sm:gap-2 sm:flex sm:w-[auto] w-fit ml-auto sm:m-0 border-0 border-amber-700 mt-2">
                    <div className="sm:m-0 ml-auto sm:gap-3  ">
                        <button
                            className=" px-4 sm:px-7 py-2 rounded-md font-serif text-sm sm:text-lg bg-amber-100 hover:bg-amber-200 shadow-lg">
                            <Link href={"/formlogin"}>Log in </Link> </button>
                        <button className="mx-3 px-4 sm:px-7 py-2 rounded-md font-serif text-sm sm:text-lg bg-green-300 hover:bg-green-400 shadow-xl">
                            <Link href={"/formsignup"}> Sign up</Link>
                        </button></div>
                </div>
            </div>
        </div>
    );
}
