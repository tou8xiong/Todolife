"use client"
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FormLogIN() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
            // Optionally redirect user to home page:
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            alert("Login failed. Check email or password.");
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
            alert("Please enter email and password");
            return;
        }
        handleLogin(email, password);
    };
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            alert(`Welcome, ${user.displayName || "User"}!`);
            window.location.href = "/";
        } catch (error: any) {
            console.error("Google login error:", error);
            alert(error.message);
        }
    };
    return (
        <div className="flex justify-center">
            <div className="sm:ml-45 font-serif text-xl  h-full w-full flex justify-center border-0 border-amber-950">
                <form id="form"
                    className=" mt-2 sm:w-[450px] sm:h-[600px] w-[600px] border-1 border-amber-400 sm:rounded-md 
                rounded-md sm:shadow-lg shadow-md shadow-gray-900"
                    onSubmit={onSubmit}>
                    <h1 className="text-center font-bold sm:text-3xl">LOG IN</h1>
                    <div className="sm:m-10 m-3 flex justify-center flex-col border-0 border-amber-700 sm:p-0 p-5">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="email" className="sm:p-1.5 p-1 border-1 border-gray-400 " required /><br />
                        <label>Password</label>
                        <input type="password" name="password" placeholder="password" className="sm:p-1.5 p-1 border-1 border-gray-400" required />
                        <br />
                        <button className="bg-sky-500 sm:p-3 p-2 rounded-md hover:bg-sky-600 cursor-pointer" type="submit">Log in</button>
                        <br />
                        <br />
                        <hr />
                        <br />
                        <div className="w-full">
                            <button onClick={handleGoogleLogin} className="p-0 border-0 w-full cursor-pointer bg-sky-300 flex text-center items-center hover:bg-sky-400" >
                                <FcGoogle className="bg-white m-0.5 mr-10" size={50} />log in with google</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}