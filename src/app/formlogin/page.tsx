"use client"
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

// ── Validation ────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
    email?: string;
    password?: string;
}

function validateFields(email: string, password: string): FieldErrors {
    const errors: FieldErrors = {};
    if (!email) {
        errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = "Enter a valid email address.";
    }
    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    }
    return errors;
}

// ── Firebase error messages ───────────────────────────────────────────────────
function parseFirebaseError(code: string): string {
    switch (code) {
        case "auth/user-not-found":
        case "auth/invalid-credential":
            return "No account found with these credentials.";
        case "auth/wrong-password":
            return "Wrong password. Please try again.";
        case "auth/invalid-email":
            return "Invalid email format.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please wait and try again.";
        case "auth/user-disabled":
            return "This account has been disabled.";
        default:
            return "Login failed. Please try again.";
    }
}

export default function FormLogIN() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Forgot password state
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    // ── Login ─────────────────────────────────────────────────────────────
    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        const errors = validateFields(trimmedEmail, password);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
            toast.success("Login successful!");
            window.location.href = "/";
        } catch (error: any) {
            toast.error(parseFirebaseError(error.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            toast.success(`Welcome, ${result.user.displayName || "User"}!`);
            window.location.href = "/";
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // ── Forgot password ───────────────────────────────────────────────────
    const handleForgotPassword = async (e?: React.SyntheticEvent) => {
        e?.preventDefault();
        const trimmed = forgotEmail.trim();
        if (!trimmed) { toast.error("Enter your email address."); return; }
        if (!EMAIL_REGEX.test(trimmed)) { toast.error("Enter a valid email address."); return; }
        setForgotLoading(true);
        try {
            await sendPasswordResetEmail(auth, trimmed);
            toast.success("Password reset link sent! Check your inbox (and spam folder).");
            setShowForgot(false);
            setForgotEmail("");
        } catch (error: any) {
            console.error("Reset password error:", error.code, error.message);
            switch (error.code) {
                case "auth/user-not-found":
                    toast.error("No account found with this email.");
                    break;
                case "auth/invalid-email":
                    toast.error("Invalid email address.");
                    break;
                case "auth/too-many-requests":
                    toast.error("Too many requests. Please wait a moment and try again.");
                    break;
                default:
                    toast.error(`Failed to send reset link (${error.code ?? "unknown"}).`);
            }
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
            <div className="font-serif text-xl h-full w-full flex justify-center border-0 border-amber-950">
                <form id="form"
                    className="mt-2 sm:w-[450px] sm:h-[600px] w-[600px] border-1 border-amber-400 sm:rounded-md rounded-md sm:shadow-lg shadow-md shadow-gray-900"
                    onSubmit={onSubmit}>
                    <h1 className="text-center font-bold sm:text-3xl">LOG IN</h1>
                    <div className="sm:m-10 m-3 flex justify-center flex-col border-0 border-amber-700 sm:p-0 p-5">

                        {/* Email */}
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                            className={`sm:p-1.5 p-1 border-1 ${fieldErrors.email ? "border-red-500 bg-red-50" : "border-gray-400"}`}
                        />
                        {fieldErrors.email && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.email}</p>}
                        <br />

                        {/* Password */}
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                            className={`sm:p-1.5 p-1 border-1 ${fieldErrors.password ? "border-red-500 bg-red-50" : "border-gray-400"}`}
                        />
                        {fieldErrors.password && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.password}</p>}

                        {/* Forgot password link */}
                        <button
                            type="button"
                            onClick={() => { setShowForgot((s) => !s); setForgotEmail(email.trim()); }}
                            className="text-xs text-sky-500 hover:underline text-left mt-1 w-fit"
                        >
                            Forgot password?
                        </button>

                        {/* Forgot password panel — uses div, NOT a nested form */}
                        {showForgot && (
                            <div className="mt-2 flex flex-col gap-1 border border-sky-200 rounded p-3 bg-sky-50">
                                <p className="text-xs text-gray-600">Enter your email and we'll send you a reset link.</p>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleForgotPassword(e as any))}
                                    placeholder="your@email.com"
                                    className="p-1 border border-gray-300 text-sm rounded"
                                />
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={forgotLoading}
                                    className="bg-sky-400 hover:bg-sky-500 text-white text-sm p-1 rounded disabled:opacity-50"
                                >
                                    {forgotLoading ? "Sending…" : "Send reset link"}
                                </button>
                            </div>
                        )}

                        <br />
                        <button
                            className="bg-sky-500 sm:p-3 p-2 rounded-md hover:bg-sky-600 cursor-pointer disabled:opacity-50"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Logging in…" : "Log in"}
                        </button>
                        <br /><br />
                        <hr />
                        <br />
                        <div className="w-full">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="p-0 border-0 w-full cursor-pointer bg-sky-300 flex text-center items-center hover:bg-sky-400"
                            >
                                <FcGoogle className="bg-white m-0.5 mr-10" size={50} />log in with google
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
