"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Task, TaskCounts } from "@/types/task";

interface Profile {
  profileImage: string | null;
  emoji: string | null;
}

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  taskCounts: TaskCounts;
  profile: Profile;
  profileLoading: boolean;
}

const AppContext = createContext<AppContextValue>({
  user: null,
  authLoading: true,
  taskCounts: { total: 0, pending: 0, completed: 0 },
  profile: { profileImage: null, emoji: null },
  profileLoading: false,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [profile, setProfile] = useState<Profile>({
    profileImage: null,
    emoji: null,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const emailRef = useRef<string | null>(null);

  const reloadTasks = useCallback(async () => {
    const email = emailRef.current;
    if (!email) return;
    try {
      const res = await fetch(`/api/tasks?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const tasks: Task[] = data.tasks ?? [];
      const total = tasks.length;
      const completed = tasks.filter((t) => t.completed).length;
      setTaskCounts({ total, pending: total - completed, completed });
    } catch {
      // keep existing counts on error
    }
  }, []);

  const reloadProfile = useCallback(async () => {
    const email = emailRef.current;
    if (!email) return;
    setProfileLoading(true);
    try {
      const res = await fetch(
        `/api/profile?email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setProfile({
        profileImage: data.profileImage ?? null,
        emoji: data.emoji ?? null,
      });
    } catch {
      // keep existing profile on error
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Single auth listener — triggers data fetches once on login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      emailRef.current = u?.email ?? null;
      setAuthLoading(false);
      if (u?.email) {
        reloadTasks();
        reloadProfile();
      } else {
        setTaskCounts({ total: 0, pending: 0, completed: 0 });
        setProfile({ profileImage: null, emoji: null });
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, [reloadTasks, reloadProfile]);

  // Listen for cross-component update events
  useEffect(() => {
    window.addEventListener("tasksUpdated", reloadTasks);
    window.addEventListener("profileUpdated", reloadProfile);
    return () => {
      window.removeEventListener("tasksUpdated", reloadTasks);
      window.removeEventListener("profileUpdated", reloadProfile);
    };
  }, [reloadTasks, reloadProfile]);

  return (
    <AppContext.Provider
      value={{ user, authLoading, taskCounts, profile, profileLoading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
