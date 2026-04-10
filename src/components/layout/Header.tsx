"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "@/public/Logo1.png";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useTaskCounts } from "@/hooks/useTaskCounts";
import {
  Menu, X, LayoutDashboard, Timer, FileText, BookOpen,
  CheckSquare, ListTodo, PlusSquare, ImageIcon, Loader2,
} from "lucide-react";
import { TbRobot } from "react-icons/tb";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; badge?: string };
type NavGroup = { group: string; items: NavItem[] };

const drawerNav: NavGroup[] = [
  {
    group: "Tasks",
    items: [
      { href: "/newtasks", label: "New Tasks", icon: PlusSquare },
      { href: "/mytasks", label: "My Tasks", icon: ListTodo, badge: "pending" },
      { href: "/completetasks", label: "Complete Tasks", icon: CheckSquare, badge: "completed" },
    ],
  },
  {
    group: "Explore",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/settimepage", label: "Set Timer", icon: Timer },
      { href: "/noteidea", label: "Idea Notes", icon: BookOpen },
      { href: "/pdfeditor", label: "PDF Annotator", icon: FileText },
      { href: "/background-removal", label: "Remove BG", icon: ImageIcon },
      { href: "/agent", label: "Agent", icon: TbRobot },
    ],
  },
];

export default function Header() {
  const { user, authLoading, profile, profileLoading } = useAppContext();
  const { pending, completed } = useTaskCounts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowProfileMenu(false);
  };

  const username = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const badgeCount = (key: string) => key === "pending" ? pending : user ? completed : 0;

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <header className="bg-blue-300 sticky top-0 z-50 shadow-md shadow-black/20 h-16">
        <div className="flex items-center justify-between px-3 h-full w-full gap-2">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image src={Logo} alt="logo" className="h-10 w-auto" priority />
          </Link>

          {/* Desktop nav buttons (md+) */}
          <nav className="hidden md:flex items-center gap-1 font-serif">
            <Link href="/newtasks"
              className="px-3 py-2 rounded-xl text-sm hover:bg-amber-100 transition-colors">
              New Tasks
            </Link>
            <Link href="/mytasks"
              className="px-3 py-2 rounded-xl text-sm hover:bg-amber-100 transition-colors flex items-center gap-1.5">
              My Tasks
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-white">{pending}</span>
            </Link>
            <Link href="/completetasks"
              className="px-3 py-2 rounded-xl text-sm hover:bg-amber-100 transition-colors flex items-center gap-1.5">
              Complete Tasks
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-green-700 text-white">{user ? completed : 0}</span>
            </Link>
          </nav>

          {/* Right side: auth + mobile menu button */}
          <div className="flex items-center gap-2 ml-auto md:ml-0">

            {/* Auth area */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            ) : !user ? (
              <div className="flex items-center gap-1.5">
                <Link href="/formlogin"
                  className="px-3 py-1.5 rounded-lg font-serif text-sm bg-amber-100 hover:bg-amber-200 shadow transition-colors">
                  Log in
                </Link>
                <Link href="/formsignup"
                  className="px-3 py-1.5 rounded-lg font-serif text-sm bg-green-300 hover:bg-green-400 shadow transition-colors">
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-blue-400/40 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-amber-100 shrink-0">
                    {profileLoading ? (
                      <Loader2 size={16} className="text-blue-400 animate-spin" />
                    ) : profile.profileImage ? (
                      <Image src={profile.profileImage} alt="profile" width={32} height={32} className="object-cover w-full h-full" />
                    ) : profile.emoji ? (
                      <Image src={profile.emoji} alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-bold text-blue-600">
                        {username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-sm hidden sm:block text-gray-800 max-w-[90px] truncate">
                    {username}
                  </span>
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                      <ul className="p-1.5 flex flex-col gap-0.5 font-serif text-gray-800">
                        <li>
                          <Link href="/profile"
                            onClick={() => setShowProfileMenu(false)}
                            className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition-colors">
                            Profile
                          </Link>
                        </li>
                        <li>
                          <button onClick={handleLogout}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 transition-colors">
                            Logout
                          </button>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-xl hover:bg-blue-400/40 transition-colors text-gray-800"
            >
              {drawerOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 z-50 md:hidden shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <span className="text-white font-bold text-base font-serif tracking-wide">Menu</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {drawerNav.map(({ group, items }) => (
            <div key={group}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2 px-1">
                {group}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map(({ href, label, icon: Icon, badge }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-serif"
                    >
                      <Icon size={17} className="text-amber-400 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {badge && badgeCount(badge) > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${badge === "pending" ? "bg-slate-700" : "bg-green-700"}`}>
                          {badgeCount(badge)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-gray-700">
          <p className="text-[10px] text-gray-600 text-center tracking-widest uppercase">TodoLife</p>
        </div>
      </aside>
    </>
  );
}
