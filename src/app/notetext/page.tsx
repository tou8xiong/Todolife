"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough,
  MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdFormatAlignJustify,
  MdFormatListBulleted, MdFormatListNumbered,
  MdAdd, MdDelete, MdSave, MdArrowBack, MdNoteAdd,
} from "react-icons/md";

interface Doc {
  id: number;
  title: string;
  content: string;
  updated_at?: string;
}

const FONT_SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "64"];

// Strip dangerous tags and event-handler attributes before setting innerHTML
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const DANGEROUS_TAGS = ["script", "iframe", "object", "embed", "form", "style", "link", "meta", "base"];
  DANGEROUS_TAGS.forEach((tag) => doc.querySelectorAll(tag).forEach((el) => el.remove()));
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (
        attr.name.startsWith("on") ||
        attr.value.trim().toLowerCase().startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

export default function NoteTextPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const editorRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const loadDocs = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/documents?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      console.error("Failed to load documents");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.email) loadDocs(u.email);
    });
    return () => unsubscribe();
  }, [loadDocs]);

  const saveDoc = useCallback(async (doc: Doc) => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, document: doc }),
      });
      if (!res.ok) throw new Error();
      await loadDocs(user.email);
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [user, loadDocs]);

  const handleSave = useCallback(() => {
    if (!activeDoc || !editorRef.current) return;
    const updated: Doc = { ...activeDoc, title, content: editorRef.current.innerHTML };
    setActiveDoc(updated);
    saveDoc(updated);
  }, [activeDoc, title, saveDoc]);

  // Ctrl+S save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  const handleNew = () => {
    const doc: Doc = { id: Date.now(), title: "Untitled Document", content: "" };
    setActiveDoc(doc);
    setTitle(doc.title);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
        editorRef.current.focus();
      }
    }, 0);
  };

  const handleOpen = (doc: Doc) => {
    setActiveDoc(doc);
    setTitle(doc.title);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = sanitizeHtml(doc.content);
    }, 0);
  };

  const handleDelete = async (id: number) => {
    if (!user?.email) return;
    const res = await fetch(
      `/api/documents?id=${id}&email=${encodeURIComponent(user.email)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (activeDoc?.id === id) {
        setActiveDoc(null);
        setTitle("");
        if (editorRef.current) editorRef.current.innerHTML = "";
      }
      toast.success("Deleted");
    }
  };

  // Rich text helpers

  const FORMAT_CMDS = [
    "bold", "italic", "underline", "strikeThrough",
    "insertUnorderedList", "insertOrderedList",
    "justifyLeft", "justifyCenter", "justifyRight", "justifyFull",
  ];

  const refreshFormats = () => {
    const active = new Set<string>();
    FORMAT_CMDS.forEach((cmd) => {
      try { if (document.queryCommandState(cmd)) active.add(cmd); } catch { }
    });
    setActiveFormats(active);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    refreshFormats();
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else {
      // No saved range yet — place cursor at end of editor so commands have a valid insertion point
      const range = document.createRange();
      range.selectNodeContents(editorRef.current!);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }
  };

  const exec = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value ?? undefined);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    refreshFormats();
  };

  const applyFontSize = (px: string) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.innerHTML = el.innerHTML;
      el.replaceWith(span);
    });
    editorRef.current?.focus();
  };

  const applyColor = (color: string) => {
    setTextColor(color);
    exec("styleWithCSS", "true");
    exec("foreColor", color);
  };

  const applyHighlight = (color: string) => {
    setHighlightColor(color);
    exec("styleWithCSS", "true");
    exec("hiliteColor", color);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 overflow-hidden">

      {/* ── Left sidebar: document list ─────────────────────────────── */}
      <div className="w-56 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700 dark:text-white">Documents</span>
          <button
            onClick={handleNew}
            className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors"
            title="New Document"
          >
            <MdAdd size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {docs.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-2 leading-relaxed">
              No documents yet.<br />Click + to create one.
            </p>
          ) : (
            docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleOpen(doc)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all group flex items-center justify-between gap-2
                  ${activeDoc?.id === doc.id
                    ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
              >
                <span className="truncate font-medium">{doc.title}</span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 shrink-0 transition-opacity"
                >
                  <MdDelete size={14} />
                </span>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/noteidea" className="flex items-center gap-2 text-xs text-gray-400 hover:text-sky-500 transition-colors">
            <MdArrowBack size={14} /> Idea Notes
          </Link>
        </div>
      </div>

      {/* ── Main editor area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeDoc ? (
          <>
            {/* Title bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-4 shrink-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 text-base font-semibold bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors placeholder:text-gray-400"
                placeholder="Enter document name..."
              />
              <span className="text-xs text-gray-400 hidden sm:block">Ctrl+S to save</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shrink-0"
              >
                <MdSave size={16} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-1 flex-wrap shrink-0">

              {/* Font size */}
              <select
                onMouseDown={saveSelection}
                onChange={(e) => applyFontSize(e.target.value)}
                defaultValue="16"
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              {/* Bold / Italic / Underline / Strikethrough */}
              {[
                { cmd: "bold", label: <strong className="text-sm">B</strong>, title: "Bold (Ctrl+B)" },
                { cmd: "italic", label: <em className="text-sm">I</em>, title: "Italic (Ctrl+I)" },
                { cmd: "underline", label: <u className="text-sm">U</u>, title: "Underline (Ctrl+U)" },
                { cmd: "strikeThrough", label: <s className="text-sm">S</s>, title: "Strikethrough" },
              ].map(({ cmd, label, title: t }) => (
                <button
                  key={cmd}
                  onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
                  title={t}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                    ${activeFormats.has(cmd)
                      ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                >
                  {label}
                </button>
              ))}

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              {/* Text color */}
              <div className="relative">
                <button
                  onMouseDown={(e) => { e.preventDefault(); colorRef.current?.click(); }}
                  title="Text Color"
                  className="w-8 h-8 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-none">A</span>
                  <span className="w-5 h-1.5 rounded-sm mt-0.5" style={{ backgroundColor: textColor }} />
                </button>
                <input
                  ref={colorRef}
                  type="color"
                  value={textColor}
                  onChange={(e) => applyColor(e.target.value)}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>

              {/* Highlight color */}
              <div className="relative">
                <button
                  onMouseDown={(e) => { e.preventDefault(); highlightRef.current?.click(); }}
                  title="Highlight Color"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-xs font-bold px-1 py-0.5 rounded" style={{ backgroundColor: highlightColor, color: "#000" }}>
                    H
                  </span>
                </button>
                <input
                  ref={highlightRef}
                  type="color"
                  value={highlightColor}
                  onChange={(e) => applyHighlight(e.target.value)}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              {/* Alignment */}
              {[
                { cmd: "justifyLeft", icon: <MdFormatAlignLeft size={18} />, title: "Align Left" },
                { cmd: "justifyCenter", icon: <MdFormatAlignCenter size={18} />, title: "Center" },
                { cmd: "justifyRight", icon: <MdFormatAlignRight size={18} />, title: "Align Right" },
                { cmd: "justifyFull", icon: <MdFormatAlignJustify size={18} />, title: "Justify" },
              ].map(({ cmd, icon, title: t }) => (
                <button
                  key={cmd}
                  onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
                  title={t}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                    ${activeFormats.has(cmd)
                      ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                >
                  {icon}
                </button>
              ))}

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              {/* Lists */}
              {[
                { cmd: "insertUnorderedList", icon: <MdFormatListBulleted size={18} />, title: "Bullet List" },
                { cmd: "insertOrderedList", icon: <MdFormatListNumbered size={18} />, title: "Numbered List" },
              ].map(({ cmd, icon, title: t }) => (
                <button
                  key={cmd}
                  onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
                  title={t}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                    ${activeFormats.has(cmd)
                      ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* A4 paper scroll area */}
            <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-8 flex justify-center">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
                onSelect={saveSelection}
                className="bg-white shadow-2xl focus:outline-none text-gray-900 shrink-0"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                  padding: "72px",
                  fontSize: "16px",
                  lineHeight: "1.7",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 px-8">
            <MdNoteAdd size={72} className="mb-4 opacity-20" />
            <p className="text-xl font-semibold mb-1 text-gray-500 dark:text-gray-400">No document open</p>
            <p className="text-sm mb-6 text-center text-gray-400">Select a document from the list or create a new one</p>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl shadow transition-all"
            >
              <MdAdd size={18} /> New Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
