"use client";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FormSignUp() {
    const [loading, setLoading] = useState(false);

    // handleSignup now accepts email/password and is called from onSubmit
    const handleSignup = async (email: string, password: string) => {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Signup success!");
        } catch (error) {
            console.error(error);
            alert("Signup failed. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "").trim();
        const password = String(form.get("password") || "");
        if (!email || !password) {
            alert("Fill email and password");
            return;
        }
        handleSignup(email, password, );
        
    };

    return (
        <div className="font-serif text-xl flex justify-center items-center">
            <div className="sm:ml-60 border-1 border-gray-400 sm:w-[450px] sm:h-[570px] mt-7 bg-cyan-50 rounded-lg shadow-xl">
                <form className="flex justify-center flex-col items-center" id="form" onSubmit={onSubmit}>
                    <h1 className="font-bold sm:text-3xl">Sign up</h1>
                    <div className="flex flex-col w-full sm:p-10 p-10 sm:text-lg ">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstname"
                            className="border-1 border-gray-400 p-1.5 rounded-sm bg-white"
                            placeholder="first name"
                        />
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastname"
                            className="border-1 border-gray-400 p-1.5 rounded-sm bg-white"
                            placeholder="last name"
                        />
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="border-1 border-gray-400 p-1.5 rounded-sm bg-white"
                            placeholder="email"
                            required
                        />
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            className="border-1 border-gray-400 p-1.5 rounded-sm bg-white"
                            placeholder="password"
                            required
                        />
                        <br />
                        <button className="bg-sky-400 hover:bg-sky-500 p-2 rounded-sm" type="submit" disabled={loading}>
                            {loading ? "Signing..." : "Sign up"}
                        </button>
                        <br />
                        <div className="w-full">
                            <button type="button" className="p-0 border-0 w-full cursor-pointer bg-sky-300 flex text-center items-center hover:bg-sky-400">
                                <FcGoogle className="bg-white sm:m-0.5 m-0.5 sm:mr-10" size={50} />
                                log in with google
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}