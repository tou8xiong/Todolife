"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BsLayoutSidebarInset } from "react-icons/bs";
import { MdDashboard, MdTimer, MdPictureAsPdf, MdPhotoSizeSelectActual } from "react-icons/md";
import { GiNotebook } from "react-icons/gi";
import { TbRobot } from "react-icons/tb";

import { useAppContext } from "@/context/AppContext";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: MdDashboard },
    { href: "/settimepage", label: "Set Timer", icon: MdTimer },
    { href: "/noteidea", label: "Idea Notes", icon: GiNotebook },
    { href: "/pdfeditor", label: "PDF Annotator", icon: MdPictureAsPdf },
    { href: "/background-removal", label: "Remove BG", icon: MdPhotoSizeSelectActual },
    { href: "/agent", label: "Agent", icon: TbRobot },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { forceExpandSidebar, toggleSidebar } = useAppContext();
    const isCompact = pathname === "/notetext" && !forceExpandSidebar;

    return (
        <aside className={`hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] ${isCompact ? 'w-16 items-center' : 'w-45'} bg-gray-900 z-40 border-r border-amber-400/20 flex-col transition-all duration-300`}>

            {/* Top icon */}
            <div
                onClick={pathname === "/notetext" ? toggleSidebar : undefined}
                className={`flex justify-center items-center py-5 border-b border-gray-700/50 ${isCompact ? 'w-full' : ''} ${pathname === '/notetext' ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''}`}
                title={pathname === '/notetext' ? 'Toggle Sidebar' : undefined}
            >
                <BsLayoutSidebarInset size={22} className="text-amber-400" />
            </div>

            {/* Nav links */}
            <nav className={`flex flex-col ${isCompact ? 'gap-3 p-2' : 'gap-1.5 p-3'} flex-1 mt-1 ${isCompact ? 'w-full' : ''}`}>
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={isCompact ? label : undefined}
                            className={`flex items-center ${isCompact ? 'justify-center p-3 mx-1' : 'gap-3 px-3 py-2.5'} rounded-xl font-serif text-sm transition-all duration-200
                                ${isActive
                                    ? "bg-amber-400/15 text-amber-400 border border-amber-400/25 shadow-sm"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
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
                <div className="px-4 py-4 border-t border-gray-700/50">
                    <p className="text-[10px] text-gray-600 text-center tracking-widest uppercase">Menu</p>
                </div>
            )}
        </aside>
    );
}
