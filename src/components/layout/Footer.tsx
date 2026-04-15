import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/Logo1.png";
import { FaSquarePhone } from "react-icons/fa6";
import { MdOutlineEmail } from "react-icons/md";
import {
  PlusSquare,
  ListTodo,
  CheckSquare,
  LayoutDashboard,
  Timer,
  BookOpen,
  FileText,
  ImageIcon,
} from "lucide-react";
import { TbRobot } from "react-icons/tb";
import { useAppContext } from "@/context/AppContext";

const taskLinks = [
  { href: "/", label: "Home" },
  { href: "/newtasks", label: "New Tasks", icon: PlusSquare },
  { href: "/mytasks", label: "My Tasks", icon: ListTodo },
  { href: "/completetasks", label: "Complete Tasks", icon: CheckSquare },
];

export default function Footer() {
  const { user } = useAppContext();

  const featureLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
    { href: "/settimepage", label: "Set Timer", icon: Timer },
    { href: "/noteidea", label: "Idea Notes", icon: BookOpen },
    { href: "/pdfeditor", label: "PDF Annotator", icon: FileText },
    { href: "/background-removal", label: "Remove BG", icon: ImageIcon },
    { href: "/agent", label: "AI Agent", icon: TbRobot, requiresAuth: true },
  ].filter(link => !link.requiresAuth || user);

  return (
    <footer className="bg-gray-900 border-t border-gray-700/50 text-gray-300 font-serif" id="footer">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10">

        {/* Top row */}
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 justify-between">

          {/* Brand */}
          <div className="flex flex-col gap-3 min-w-[140px]">
            <div className="bg-white rounded-xl p-2 w-fit">
              <Image src={Logo} alt="TodoLife" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-gray-400 max-w-[180px] leading-relaxed">
              Your personal task and life management app.
            </p>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Tasks</h3>
            <ul className="flex flex-col gap-2.5">
              {taskLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {Icon && <Icon size={14} className="shrink-0" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Features</h3>
            <ul className="flex flex-col gap-2.5">
              {featureLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <Icon size={14} className="shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">Contact</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <FaSquarePhone size={18} className="text-green-400 shrink-0" />
                78292260
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <MdOutlineEmail size={18} className="text-amber-400 shrink-0" />
                touxhk@gmail.com
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-gray-700/50 pt-6 text-center text-xs text-gray-600">
          © 2025 TodoLife · Vientiane, Laos · Built by TouXY
        </div>
      </div>
    </footer>
  );
}
