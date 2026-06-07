"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import type { Locale } from "@/locales/translations";
import {
  Settings, Moon, Sun, Bell, BellOff, User, LogOut,
  ShieldAlert, Info, ChevronRight, Trash2, Globe, Check,
} from "lucide-react";
import PageHelpTooltip from "@/components/ui/PageHelpTooltip";

const LANGUAGES: { locale: Locale; label: string; native: string; flag: string }[] = [
  { locale: "en", label: "English", native: "English", flag: "🇬🇧" },
  { locale: "lo", label: "Lao", native: "ພາສາລາວ", flag: "🇱🇦" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { locale, t, setLocale } = useLanguage();
  const s = t.settings;
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => { setThemeMounted(true); }, []);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success(t.settings.account.signOut);
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user);
      toast.success("Account deleted");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account. Please re-login and try again.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    toast.success(t.settings.language.saved);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-600">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isDark = theme === "dark";

  const THEME_OPTIONS: { value: "dark" | "light"; label: string; icon: React.ElementType; hint: string }[] = [
    { value: "dark", label: "Default", icon: Moon, hint: "Current look" },
    { value: "light", label: "Light", icon: Sun, hint: "White & bright" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-600 font-serif relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      {/* Background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12 relative z-10 flex flex-col gap-5 sm:gap-6">

        {/* Page heading */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-white/10 border border-slate-300 dark:border-white/10 shadow-lg">
            <Settings size={20} className="text-sky-500 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {s.title}
              <PageHelpTooltip subtitle={t.pageHelp.settings.subtitle} description={t.pageHelp.settings.description} />
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-300">{s.subtitle}</p>
          </div>
        </div>

        {/* ── Appearance ───────────────────────────────────────── */}
        <section className="bg-slate-100/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl transition-colors">
          <h2 className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-widest mb-4">
            {s.appearance.section}
          </h2>

          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{s.appearance.theme}</p>
            <p className="text-xs text-slate-600 dark:text-gray-300 mt-0.5">
              {isDark ? s.appearance.darkMode : s.appearance.lightMode}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon, hint }) => {
              const isActive = themeMounted && theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    toast.success(label);
                  }}
                  className={`relative flex flex-col items-center gap-1.5 px-2 py-3 sm:py-4 rounded-xl border text-center transition-all duration-200
                    ${isActive
                      ? "bg-amber-100 dark:bg-amber-500/15 border-amber-400 dark:border-amber-400/40 shadow-sm"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
                    }`}
                >
                  <Icon size={18} className={isActive ? "text-amber-600 dark:text-amber-300" : "text-slate-600 dark:text-gray-300"} />
                  <p className={`text-xs sm:text-sm font-semibold ${isActive ? "text-amber-700 dark:text-amber-200" : "text-slate-800 dark:text-white"}`}>
                    {label}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-gray-400 leading-tight hidden sm:block">{hint}</p>
                  {isActive && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Language ─────────────────────────────────────────── */}
        <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl transition-colors">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Globe size={13} /> {s.language.section}
          </h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{s.language.label}</p>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">{s.language.subtitle}</p>
          </div>
          <div className="flex flex-col gap-3">
            {LANGUAGES.map((lang) => {
              const isActive = locale === lang.locale;
              return (
                <button
                  key={lang.locale}
                  onClick={() => handleLanguageChange(lang.locale)}
                  className={`relative flex items-center gap-3 px-4 py-4 rounded-md border text-left transition-all duration-200
                    ${isActive
                      ? "bg-sky-500/10 border-sky-500/50 shadow-sm shadow-sky-500/10"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? "text-sky-600 dark:text-sky-300" : "text-slate-900 dark:text-white"}`}>
                      {lang.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{lang.native}</p>
                  </div>
                  {isActive && (
                    <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────────── */}
        <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl transition-colors">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            {s.notifications.section}
          </h2>

          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-amber-500 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.notifications.taskUpdates}</p>
                <p className="text-xs text-slate-500 dark:text-gray-300">{s.notifications.taskUpdatesDesc}</p>
              </div>
            </div>
            <button
              onClick={() => { setNotifyTasks(!notifyTasks); toast(notifyTasks ? s.notifications.off : s.notifications.on); }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none
                ${notifyTasks ? "bg-sky-500" : "bg-slate-200 dark:bg-white/10"}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300
                  ${notifyTasks ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {notifyReminders
                ? <Bell size={18} className="text-green-500 dark:text-green-400" />
                : <BellOff size={18} className="text-slate-400 dark:text-gray-500" />}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.notifications.reminders}</p>
                <p className="text-xs text-slate-500 dark:text-gray-300">{s.notifications.remindersDesc}</p>
              </div>
            </div>
            <button
              onClick={() => { setNotifyReminders(!notifyReminders); toast(notifyReminders ? s.notifications.off : s.notifications.on); }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none
                ${notifyReminders ? "bg-sky-500" : "bg-slate-200 dark:bg-white/10"}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300
                  ${notifyReminders ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </section>

        {/* ── Account ──────────────────────────────────────────── */}
        <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl transition-colors">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            {s.account.section}
          </h2>

          {user && (
            <div className="flex items-center gap-3 mb-4 px-3 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  {(user.displayName || user.email || "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user.displayName || s.account.noName}
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-300 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Link
            href="/profile"
            className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <User size={17} className="text-sky-500 dark:text-sky-400" />
              <p className="text-sm text-slate-900 dark:text-white">{s.account.editProfile}</p>
            </div>
            <ChevronRight size={15} className="text-slate-400 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all text-left mt-1"
          >
            <LogOut size={17} className="text-red-500 dark:text-red-400" />
            <p className="text-sm text-red-500 dark:text-red-400">{s.account.signOut}</p>
          </button>
        </section>

        {/* ── Danger Zone ──────────────────────────────────────── */}
        <section className="bg-red-50 dark:bg-red-500/5 backdrop-blur-xl border border-red-200 dark:border-red-500/20 rounded-3xl p-6 shadow-xl transition-colors">
          <h2 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert size={13} /> {s.dangerZone.section}
          </h2>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-md bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 border border-red-300 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium transition-all"
            >
              <Trash2 size={16} />
              {s.dangerZone.deleteAccount}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600 dark:text-red-300">{s.dangerZone.confirmMessage}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 sm:py-2.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 text-sm transition-all bg-white dark:bg-white/5"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 sm:py-2.5 rounded-md bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Trash2 size={14} /> {s.dangerZone.yesDelete}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── About ────────────────────────────────────────────── */}
        <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl transition-colors">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info size={13} /> {s.about.section}
          </h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>{s.about.app}</span>
              <span className="text-slate-900 dark:text-white font-medium">Todolife</span>
            </div>
            <div className="flex justify-between">
              <span>{s.about.version}</span>
              <span className="text-slate-900 dark:text-white font-medium">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>{s.about.framework}</span>
              <span className="text-slate-900 dark:text-white font-medium">Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span>{s.about.builtBy}</span>
              <span className="text-slate-900 dark:text-white font-medium">TouXY</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
