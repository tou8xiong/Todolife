"use client";
import Image from "next/image";
import Logo from "../public/Logo1.png"
import Link from "next/link";
import { useTaskCounts } from "./useTaskCounts";


export default function Header() {
    const { pending, completed } = useTaskCounts();
    return (
        <div className="bg-blue-300  sm:flex flex-wrap sm:items-center sm:w-full
         justify-between sm:justify-between sm:gap-2 sticky top-0 z-50 shadow-xl sm:border-0 border-red-400 w-full sm:px-4 py-2 max-w-full">
            <button className="m-1 cursor-pointer"><Link href={"/"}>
                <Image src={Logo} alt="logo" className="w-32 sm:w-48 md:w-[250px]" /></Link>
            </button>
            <div className="flex flex-wrap gap-2 justify-around sm:items-center sm:gap-6
              font-serif   sm:border-0 border-fuchsia-600  ">
                <button
                    className="sm:hover:bg-amber-100 sm:p-2 p-2 sm:rounded-xl sm:px-3 sm:border-0 border-2 rounded-xl border-sky-600">
                    <Link href={"/newtasks"}  className="sm:text-lg text-[12px] ">New Tasks</Link>
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
    
            <div className="sm:p-2 flex sm:gap-2 sm:flex sm:w-fit w-full sm:m-0 border-0 border-amber-700 mt-2">
                <div className="sm:m-0 ml-auto sm:gap-3 ">
                <button
                    className=" px-4 sm:px-7 py-2 rounded-md font-serif text-sm sm:text-lg bg-amber-100 hover:bg-amber-200 shadow-lg">
                    <Link href={"/formlogin"}>Log in </Link> </button>
                <button className="mx-3 px-4 sm:px-7 py-2 rounded-md font-serif text-sm sm:text-lg bg-green-300 hover:bg-green-400 shadow-xl">
                    <Link href={"/formsignup"}> Sign up</Link>
                </button></div>
            </div>
        </div>
    );
}
