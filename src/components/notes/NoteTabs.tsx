"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdDescription } from "react-icons/md";
import { GiNotebook } from "react-icons/gi";
import { useLanguage } from "@/context/LanguageContext";

export default function NoteTabs() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isDocuments = pathname.startsWith("/notetext");

  const base = "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all";
  const active = "bg-sky-500 text-white shadow-lg shadow-sky-500/30";
  const inactive = "bg-white/10 text-gray-200 hover:bg-white/20";

  return (
    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1.5 w-fit">
      <Link href="/notetext" className={`${base} ${isDocuments ? active : inactive}`}>
        <MdDescription size={16} />
        {t.nav.documents}
      </Link>
      <Link href="/noteidea" className={`${base} ${!isDocuments ? active : inactive}`}>
        <GiNotebook size={16} />
        {t.nav.ideaNotes}
      </Link>
    </div>
  );
}
