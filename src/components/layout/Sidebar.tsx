"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BsLayoutSidebarInset } from "react-icons/bs";
import { MdDashboard, MdTimer, MdPictureAsPdf, MdPhotoSizeSelectActual } from "react-icons/md";
import { GiNotebook } from "react-icons/gi";
import { ScanText } from "lucide-react";
import AiIcon from "@/components/ui/AiIcon";

import { useAppContext } from "@/context/AppContext";

import { useLanguage } from "@/context/LanguageContext";

const navItems = [
    { href: "/dashboard", key: "dashboard", icon: MdDashboard },
    { href: "/settimepage", key: "timer", icon: MdTimer },
    { href: "/notetext", key: "documents", icon: GiNotebook },
    { href: "/pdfeditor", key: "pdfAnnotator", icon: MdPictureAsPdf },
    { href: "/background-removal", key: "removeBg", icon: MdPhotoSizeSelectActual },
    { href: "/imagetotext", key: "imageToText", icon: ScanText },
    { href: "/agent", key: "agent", icon: AiIcon },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { forceExpandSidebar, forceCollapseSidebar, toggleSidebar, toggleCollapseSidebar } = useAppContext();
    const { t } = useLanguage();
    const compactPages = ["/notetext", "/background-removal"];
    const isCompactPage = compactPages.some(p => pathname.startsWith(p));
    const isCompact = isCompactPage ? !forceExpandSidebar : forceCollapseSidebar;
    const handleToggle = isCompactPage ? toggleSidebar : toggleCollapseSidebar;

    return (
        <aside className={`hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] ${isCompact ? 'w-16 items-center' : 'w-45'} bg-white dark:bg-gray-900 z-40 border-r border-amber-400/30 dark:border-amber-400/20 flex-col transition-all duration-300`}>

            {/* Top icon */}
            <div
                onClick={handleToggle}
                className="flex justify-center items-center py-5 border-b border-slate-200 dark:border-gray-700/50 w-full cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                title={isCompact ? 'Open Sidebar' : 'Close Sidebar'}
            >
                <BsLayoutSidebarInset size={22} className="text-amber-500 dark:text-amber-400" />
            </div>

            {/* Nav links */}
            <nav className={`flex flex-col ${isCompact ? 'gap-3 p-2' : 'gap-1.5 p-3'} flex-1 mt-1 ${isCompact ? 'w-full' : ''}`}>
                {navItems.map(({ href, key, icon: Icon }) => {
                    const isActive = pathname === href;
                    const label = t.nav[key as keyof typeof t.nav];
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={isCompact ? label : undefined}
                            className={`flex items-center ${isCompact ? 'justify-center p-3 mx-1' : 'gap-3 px-3 py-2.5'} rounded-md font-serif text-sm transition-all duration-200
                                ${isActive
                                    ? "bg-amber-100 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-400/25 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                }`}
                        >
                            <Icon size={isCompact ? 20 : 18} className="shrink-0" />
                            {!isCompact && <span className="truncate">{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom label */}
            {!isCompact && (
                <div className="px-4 py-4 border-t border-slate-200 dark:border-gray-700/50">
                    <p className="text-[10px] text-slate-500 dark:text-gray-600 text-center tracking-widest uppercase">{t.nav.menu}</p>
                </div>
            )}
        </aside>
    );
}
