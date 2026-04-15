"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough,
  MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdFormatAlignJustify,
  MdFormatListBulleted, MdFormatListNumbered,
  MdAdd, MdDelete, MdSave, MdArrowBack, MdNoteAdd, MdInsertDriveFile,
} from "react-icons/md";
import { useTipTapEditor } from "@/hooks/useTipTapEditor";
import { EditorContent } from "@tiptap/react";

interface Doc {
  id: number;
  title: string;
  content: string;
  updated_at?: string;
}

const FONT_SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "64"];

const FILE_COLORS = [
  { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-500" },
  { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-500" },
  { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-500" },
  { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-500" },
  { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-500" },
];

const getFileColor = (index: number) => {
  return FILE_COLORS[index % FILE_COLORS.length];
};

const FONT_FAMILIES = [
  { label: "Georgia", value: "Georgia" },
  { label: "Arial", value: "Arial" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Impact", value: "Impact" },
  { label: "Comic Sans MS", value: "Comic Sans MS" },
];

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

  const editorContainerRef = useRef<HTMLDivElement>(null);

  const {
    editor,
    EditorContent,
    currentFontFamily,
    currentFontSize,
    isBulletList,
    isOrderedList,
    activeFormats,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    setFontFamily,
    setFontSize,
    setTextColor,
    setHighlight,
    setTextAlign,
    toggleBulletList,
    toggleOrderedList,
    handleKeyDown,
  } = useTipTapEditor();

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
      const content = editor?.getHTML() || "";
      const docToSave = { ...doc, content };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, document: docToSave }),
      });
      if (!res.ok) throw new Error();
      await loadDocs(user.email);
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [user, loadDocs, editor]);

  const handleSave = useCallback(() => {
    if (!activeDoc || !editor) return;
    const content = editor.getHTML();
    const updated: Doc = { ...activeDoc, title, content };
    setActiveDoc(updated);
    saveDoc(updated);
  }, [activeDoc, title, saveDoc, editor]);

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
    editor?.commands.clearContent();
  };

  const handleOpen = (doc: Doc) => {
    setActiveDoc(doc);
    setTitle(doc.title);
    if (doc.content) {
      editor?.commands.setContent(sanitizeHtml(doc.content));
    } else {
      editor?.commands.clearContent();
    }
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
        editor?.commands.clearContent();
      }
      toast.success("Deleted");
    }
  };

  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
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
            docs.map((doc, index) => {
              const color = getFileColor(index);
              return (
              <button
                key={doc.id}
                onClick={() => handleOpen(doc)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all group flex items-center gap-2
                  ${activeDoc?.id === doc.id
                    ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
              >
                <span className={`p-1.5 rounded-lg ${color.bg} shrink-0`}>
                  <MdInsertDriveFile size={14} className={color.text} />
                </span>
                <span className="truncate font-medium flex-1">{doc.title}</span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 shrink-0 transition-opacity"
                >
                  <MdDelete size={14} />
                </span>
              </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/noteidea" className="flex items-center gap-2 text-xs text-gray-400 hover:text-sky-500 transition-colors">
            <MdArrowBack size={14} /> Idea Notes
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeDoc ? (
          <>
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

            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-1 flex-wrap shrink-0">
              <select
                value={currentFontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer min-w-[120px]"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>

              <select
                value={currentFontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-20"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              <button
                onClick={toggleBold}
                title="Bold (Ctrl+B)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("bold")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                <strong className="text-sm">B</strong>
              </button>

              <button
                onClick={toggleItalic}
                title="Italic (Ctrl+I)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("italic")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                <em className="text-sm">I</em>
              </button>

              <button
                onClick={toggleUnderline}
                title="Underline (Ctrl+U)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("underline")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                <u className="text-sm">U</u>
              </button>

              <button
                onClick={toggleStrike}
                title="Strikethrough"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("strikeThrough")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                <s className="text-sm">S</s>
              </button>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              <div className="relative">
                <button
                  onClick={() => colorInputRef.current?.click()}
                  title="Text Color"
                  className="w-8 h-8 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-none">A</span>
                  <span className="w-5 h-1.5 rounded-sm mt-0.5" style={{ backgroundColor: "#000000" }} />
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value="#000000"
                  onChange={(e) => setTextColor(e.target.value)}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => highlightInputRef.current?.click()}
                  title="Highlight Color"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-xs font-bold px-1 py-0.5 rounded" style={{ backgroundColor: "#ffff00", color: "#000" }}>
                    H
                  </span>
                </button>
                <input
                  ref={highlightInputRef}
                  type="color"
                  value="#ffff00"
                  onChange={(e) => setHighlight(e.target.value)}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              <button
                onClick={() => setTextAlign("left")}
                title="Align Left"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("justifyLeft")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                <MdFormatAlignLeft size={18} />
              </button>

              <button
                onClick={() => setTextAlign("center")}
                title="Center"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("justifyCenter")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                <MdFormatAlignCenter size={18} />
              </button>

              <button
                onClick={() => setTextAlign("right")}
                title="Align Right"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("justifyRight")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                <MdFormatAlignRight size={18} />
              </button>

              <button
                onClick={() => setTextAlign("justify")}
                title="Justify"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${activeFormats.has("justifyFull")
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                <MdFormatAlignJustify size={18} />
              </button>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

              <button
                onClick={toggleBulletList}
                title="Bullet List"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${isBulletList
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                <MdFormatListBulleted size={18} />
              </button>

              <button
                onClick={toggleOrderedList}
                title="Numbered List"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                  ${isOrderedList
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 ring-1 ring-sky-300 dark:ring-sky-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
              >
                <MdFormatListNumbered size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-8 flex justify-center">
              <div
                ref={editorContainerRef}
                className="bg-white shadow-2xl shrink-0 tiptap-editor-container"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                }}
              >
                <div
                  onKeyDown={handleKeyDown}
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </>
        ) : (
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

      <style jsx global>{`
        .tiptap-editor-container .ProseMirror {
          outline: none;
          padding: 72px;
          font-size: 16px;
          line-height: 1.7;
          min-height: 1123px;
          font-family: Georgia, 'Times New Roman', serif;
        }
        .tiptap-editor-container .ProseMirror p {
          margin: 0 0 1em 0;
        }
        .tiptap-editor-container .ProseMirror ul,
        .tiptap-editor-container .ProseMirror ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }
        .tiptap-editor-container .ProseMirror li {
          margin: 0.25em 0;
        }
        .tiptap-editor-container .ProseMirror ul li {
          list-style-type: disc;
        }
        .tiptap-editor-container .ProseMirror ol li {
          list-style-type: decimal;
        }
        .tiptap-editor-container .ProseMirror ul ul li {
          list-style-type: circle;
        }
        .tiptap-editor-container .ProseMirror ol ol li {
          list-style-type: lower-alpha;
        }
        .tiptap-editor-container .ProseMirror blockquote {
          border-left: 4px solid #38bdf8;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #64748b;
        }
        .tiptap-editor-container .ProseMirror pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          font-family: monospace;
          overflow: auto;
        }
        .tiptap-editor-container .ProseMirror code {
          background: #f1f5f9;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
        .tiptap-editor-container .ProseMirror hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 24px 0;
        }
        .tiptap-editor-container .ProseMirror h1 {
          font-size: 32px;
          font-weight: bold;
          margin: 24px 0 16px;
        }
        .tiptap-editor-container .ProseMirror h2 {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0 12px;
        }
        .tiptap-editor-container .ProseMirror h3 {
          font-size: 20px;
          font-weight: bold;
          margin: 16px 0 8px;
        }
      `}</style>
    </div>
  );
}
