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
import { authFetch } from "@/lib/authFetch";
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
  forceExpandSidebar: boolean;
  forceCollapseSidebar: boolean;
  toggleSidebar: () => void;
  toggleCollapseSidebar: () => void;
}

const AppContext = createContext<AppContextValue>({
  user: null,
  authLoading: true,
  taskCounts: { total: 0, pending: 0, completed: 0 },
  profile: { profileImage: null, emoji: null },
  profileLoading: false,
  forceExpandSidebar: false,
  forceCollapseSidebar: false,
  toggleSidebar: () => {},
  toggleCollapseSidebar: () => {},
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
  const [forceExpandSidebar, setForceExpandSidebar] = useState(false);
  const [forceCollapseSidebar, setForceCollapseSidebar] = useState(false);
  const emailRef = useRef<string | null>(null);

  const toggleSidebar = useCallback(() => {
    setForceExpandSidebar((prev) => !prev);
  }, []);

  const toggleCollapseSidebar = useCallback(() => {
    setForceCollapseSidebar((prev) => !prev);
  }, []);

  const reloadTasks = useCallback(async () => {
    const email = emailRef.current;
    if (!email) return;
    try {
      const res = await authFetch(`/api/tasks`);
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
      // Refresh Firebase user so displayName/photoURL changes propagate to consumers (Header, etc.)
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setUser(auth.currentUser ? { ...auth.currentUser } : null);
      }

      const res = await authFetch(
        `/api/profile`,
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
      value={{ user, authLoading, taskCounts, profile, profileLoading, forceExpandSidebar, forceCollapseSidebar, toggleSidebar, toggleCollapseSidebar }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
