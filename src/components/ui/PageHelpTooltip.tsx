"use client";
import { useState, useRef, useEffect } from "react";
import { FaRegQuestionCircle } from "react-icons/fa";

interface PageHelpTooltipProps {
  subtitle: string;
  description: string;
  className?: string;
  iconSize?: number;
  side?: "right" | "left" | "bottom" | "top";
}

const SIDE_POS: Record<NonNullable<PageHelpTooltipProps["side"]>, string> = {
  right: "left-full ml-2 top-1/2 -translate-y-1/2",
  left: "right-full mr-2 top-1/2 -translate-y-1/2",
  bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
  top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
};

export default function PageHelpTooltip({
  subtitle,
  description,
  className = "",
  iconSize = 14,
  side = "bottom",
}: PageHelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex group align-middle ${className}`}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Help"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
      >
        <FaRegQuestionCircle size={iconSize} />
      </button>
      <div
        role="tooltip"
        className={`absolute ${SIDE_POS[side]} z-50 w-64 sm:w-72 bg-gray-800 text-left rounded-lg shadow-xl border border-amber-400/30 px-3 py-2.5
          transition-opacity duration-150
          ${open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
          group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto`}
      >
        <p className="text-xs font-bold text-amber-400 mb-1">{subtitle}</p>
        <p className="text-xs text-gray-200 leading-relaxed font-normal whitespace-normal">{description}</p>
      </div>
    </div>
  );
}
