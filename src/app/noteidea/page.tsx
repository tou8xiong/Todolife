"use client"
import { GiNotebook } from "react-icons/gi";
import { useState, useEffect } from "react";
import { MdDelete, MdEdit, MdCheck, MdClose, MdDescription } from "react-icons/md";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAlert } from "@/hooks/useAlert";
import { authFetch } from "@/lib/authFetch";
import { useLanguage } from "@/context/LanguageContext";

interface Idea {
    id: number;
    ideatext: string;
}

export default function NooteBook() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { t } = useLanguage();
    const [curentideas, setCurentIdeas] = useState({ ideatext: "" });
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [user, setUser] = useState<any>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");

    const loadIdeas = async () => {
        try {
            const res = await authFetch(`/api/ideas`);
            const data = await res.json();
            setIdeas(data.ideas ?? []);
        } catch (err) {
            console.error("Failed to load ideas", err);
        }
    };

    const saveIdeas = async (updated: Idea[]) => {
        await authFetch("/api/ideas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ideas: updated }),
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser?.email) loadIdeas();
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurentIdeas((prev) => ({ ...prev, [name]: value }));
    };

    const handleaddIdea = async () => {
        if (!curentideas.ideatext.trim()) return;
        if (!user) {
            sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
            showAlert({
                title: "Login Required",
                message: "Please login to add an idea.",
                type: "warning",
                confirmText: "Login",
                linkToLogin: true,
            });
            return;
        }
        const newIdea = { id: Date.now(), ...curentideas };
        const updatedIdeas = [...ideas, newIdea];
        setIdeas(updatedIdeas);
        setCurentIdeas({ ideatext: "" });
        await saveIdeas(updatedIdeas);
        window.dispatchEvent(new Event("tasksUpdated"));
        toast.success("Idea added!");
    };

    const handleDelete = async (id: number) => {
        if (!user) {
            sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
            showAlert({
                title: "Login Required",
                message: "Please login to delete ideas.",
                type: "warning",
                confirmText: "Login",
                linkToLogin: true,
            });
            return;
        }
        const updatedIdeas = ideas.filter((idea) => idea.id !== id);
        setIdeas(updatedIdeas);
        await saveIdeas(updatedIdeas);
        window.dispatchEvent(new Event("tasksUpdated"));
    };

    const handleEditStart = (idea: Idea) => {
        if (!user) {
            sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
            showAlert({
                title: "Login Required",
                message: "Please login to edit ideas.",
                type: "warning",
                confirmText: "Login",
                linkToLogin: true,
            });
            return;
        }
        setEditingId(idea.id);
        setEditText(idea.ideatext);
    };

    const handleEditSave = async (id: number) => {
        if (!editText.trim()) return;
        const updatedIdeas = ideas.map((idea) =>
            idea.id === id ? { ...idea, ideatext: editText } : idea
        );
        setIdeas(updatedIdeas);
        setEditingId(null);
        setEditText("");
        await saveIdeas(updatedIdeas);
        toast.success("Idea updated!");
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditText("");
    };

    return (
        <div className="min-h-screen bg-tool p-4 sm:p-8 font-serif text-white relative transition-all duration-300">

            {/* Top Right Button */}
            <Link
                href="/notetext"
                className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/30 transition-all z-20"
            >
                <MdDescription size={18} />
                {t.noteIdea.noteText}
            </Link>

            {/* Header */}
            <div className="flex flex-col items-center mb-8" data-aos="fade-down">
                <div className="bg-white/10 backdrop-blur-md rounded-full p-4 shadow-md mb-3 border border-white/10">
                    <GiNotebook size={48} className="text-sky-500 dark:text-sky-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{t.noteIdea.title}</h1>
                <p className="text-sm text-gray-300 mt-1">{t.noteIdea.subtitle}</p>
            </div>

            {/* Input Card */}
            <div className="max-w-2xl mx-auto mb-8" data-aos="zoom-in">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-5 border border-white/10">
                    <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-3">{t.noteIdea.newIdea}</p>
                    <div className="flex gap-3">
                        <input
                            placeholder={t.noteIdea.placeholder}
                            type="text"
                            name="ideatext"
                            onChange={handleChange}
                            value={curentideas.ideatext}
                            onKeyDown={(e) => e.key === "Enter" && handleaddIdea()}
                            className="flex-1 bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                        />
                        <button
                            onClick={handleaddIdea}
                            className="px-5 py-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-sm font-semibold rounded-md shadow transition-all"
                        >
                            {t.noteIdea.keep}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes List */}
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-white">
                        {t.noteIdea.yourIdeas}
                        <span className="ml-2 text-xs font-normal text-gray-300">({ideas.length})</span>
                    </h2>
                </div>

                {ideas.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-400">
                        <GiNotebook size={64} />
                        <p className="mt-3 text-sm">{t.noteIdea.noIdeas}</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {[...ideas].reverse().map((idea, index) => (
                            <li
                                key={idea.id}
                                className="group bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                            >
                                <span className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 text-sky-500 text-xs font-bold shrink-0">
                                    {ideas.length - index}
                                </span>

                                {editingId === idea.id ? (
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            autoFocus
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleEditSave(idea.id);
                                                if (e.key === "Escape") handleEditCancel();
                                            }}
                                            className="flex-1 bg-white/10 text-white border border-sky-400 rounded-xl px-3 py-1.5 text-sm focus:outline-none"
                                        />
                                        <button
                                            onClick={() => handleEditSave(idea.id)}
                                            className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 shrink-0"
                                        >
                                            <MdCheck size={18} className="text-sky-500" />
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                                        >
                                            <MdClose size={18} className="text-gray-500 dark:text-gray-300" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="flex-1 text-gray-100 text-sm leading-relaxed break-words">
                                            {idea.ideatext}
                                        </p>
                                        <button
                                            onClick={() => handleEditStart(idea)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-sky-50 dark:hover:bg-sky-900/30 shrink-0"
                                        >
                                            <MdEdit size={20} className="text-sky-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(idea.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0"
                                        >
                                            <MdDelete size={20} className="text-red-400" />
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
