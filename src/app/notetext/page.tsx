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
  MdFolder, MdFolderOpen, MdCreateNewFolder, MdExpandMore, MdChevronRight,
  MdGridView, MdDescription,
} from "react-icons/md";
import { useTipTapEditor } from "@/hooks/useTipTapEditor";
import { EditorContent } from "@tiptap/react";

interface Doc {
  id: number;
  title: string;
  content: string;
  folder_id?: string | null;
  updated_at?: string;
}

interface Folder {
  id: string;
  name: string;
  user_email?: string;
  created_at?: string;
}

const FONT_SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "64"];

const FILE_COLORS = [
  { bg: "bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/50 dark:to-sky-800/50", text: "text-sky-600 dark:text-sky-300", border: "border-sky-300 dark:border-sky-700", accent: "bg-sky-500" },
  { bg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50", text: "text-emerald-600 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", accent: "bg-emerald-500" },
  { bg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50", text: "text-amber-600 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700", accent: "bg-amber-500" },
  { bg: "bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/50 dark:to-rose-800/50", text: "text-rose-600 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700", accent: "bg-rose-500" },
  { bg: "bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/50 dark:to-violet-800/50", text: "text-violet-600 dark:text-violet-300", border: "border-violet-300 dark:border-violet-700", accent: "bg-violet-500" },
  { bg: "bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/50 dark:to-cyan-800/50", text: "text-cyan-600 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700", accent: "bg-cyan-500" },
  { bg: "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50", text: "text-orange-600 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", accent: "bg-orange-500" },
  { bg: "bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50", text: "text-pink-600 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700", accent: "bg-pink-500" },
];

const FOLDER_COLORS = [
  { bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-500 dark:text-sky-400", border: "hover:border-sky-400" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-500 dark:text-emerald-400", border: "hover:border-emerald-400" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-500 dark:text-amber-400", border: "hover:border-amber-400" },
  { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-500 dark:text-rose-400", border: "hover:border-rose-400" },
  { bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-500 dark:text-violet-400", border: "hover:border-violet-400" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-500 dark:text-cyan-400", border: "hover:border-cyan-400" },
  { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-500 dark:text-orange-400", border: "hover:border-orange-400" },
  { bg: "bg-pink-100 dark:bg-pink-900/40", text: "text-pink-500 dark:text-pink-400", border: "hover:border-pink-400" },
];

const getFileColor = (index: number) => FILE_COLORS[index % FILE_COLORS.length];
const getFolderColor = (index: number) => FOLDER_COLORS[index % FOLDER_COLORS.length];

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

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NoteTextPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  const loadFolders = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/folders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setFolders(data.folders ?? []);
    } catch {
      console.error("Failed to load folders");
    }
  }, []);

  const createFolder = useCallback(async () => {
    if (!user?.email || !newFolderName.trim()) return;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, folder: { name: newFolderName.trim() } }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
          return;
        }
        await loadFolders(user.email);
        setNewFolderName("");
        setShowNewFolderInput(false);
        toast.success("Folder created");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create folder");
      }
    } catch {
      toast.error("Failed to create folder");
    }
  }, [user, newFolderName, loadFolders]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user?.email) return;
    const res = await fetch(
      `/api/folders?id=${folderId}&email=${encodeURIComponent(user.email)}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      await loadDocs(user.email);
      toast.success("Folder deleted");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to delete folder");
    }
  }, [user, selectedFolderId, loadDocs]);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.email) {
        loadDocs(u.email);
        loadFolders(u.email);
      }
    });
    return () => unsubscribe();
  }, [loadDocs, loadFolders]);

  const saveDoc = useCallback(async (doc: Doc) => {
    if (!user?.email) return;
    setSaving(true);
    try {
      const content = editor?.getHTML() || "";
      const docToSave = { ...doc, content, folder_id: doc.folder_id };
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
    const doc: Doc = { id: Date.now(), title: "Untitled Document", content: "", folder_id: selectedFolderId };
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

  const displayedDocs = selectedFolderId
    ? docs.filter((d) => d.folder_id === selectedFolderId)
    : docs;

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <div className="w-72 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">My Workspace</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-all"
                title="New Folder"
              >
                <MdCreateNewFolder size={18} />
              </button>
              <button
                onClick={handleNew}
                className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
                title="New Document"
              >
                <MdAdd size={18} />
              </button>
            </div>
          </div>

          {showNewFolderInput && (
            <div className="space-y-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
                onBlur={() => { if (!newFolderName.trim()) setShowNewFolderInput(false); }}
                placeholder="Folder name..."
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-transparent transition-all"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={createFolder}
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }}
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => { setSelectedFolderId(null); setActiveDoc(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 group
              ${selectedFolderId === null && !activeDoc
                ? "bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-800/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white"
              }`}
          >
            <MdGridView size={18} />
            <span>All Documents</span>
            <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{docs.length}</span>
          </button>

          <div className="border-t border-gray-100 dark:border-gray-800 my-3" />

          <div className="flex items-center gap-2 px-3 mb-2">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Folders</p>
            <span className="text-[11px] text-gray-300 dark:text-gray-600">{folders.length}</span>
          </div>

          {folders.map((folder, index) => {
            const folderDocs = docs.filter((d) => d.folder_id === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const folderColor = getFolderColor(index);
            const isSelected = selectedFolderId === folder.id;

            return (
              <div key={folder.id} className="space-y-0.5">
                <div className={`flex items-center gap-1 rounded-xl transition-all ${isSelected ? "bg-gradient-to-r from-sky-50 to-transparent dark:from-sky-900/20 dark:to-transparent" : ""}`}>
                  <button
                    onClick={() => { setSelectedFolderId(folder.id); setActiveDoc(null); toggleFolderExpand(folder.id); }}
                    className={`flex-1 text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 group
                      ${isSelected
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                      }`}
                  >
                    {isExpanded ? (
                      <MdExpandMore size={18} className="shrink-0" />
                    ) : (
                      <MdChevronRight size={18} className="shrink-0" />
                    )}
                    <span className={`p-1.5 rounded-lg ${folderColor.bg} shrink-0 transition-transform ${isExpanded ? "scale-110" : ""}`}>
                      {isExpanded ? (
                        <MdFolderOpen size={16} className={folderColor.text} />
                      ) : (
                        <MdFolder size={16} className={folderColor.text} />
                      )}
                    </span>
                    <span className="truncate">{folder.name}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"} group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors`}>
                      {folderDocs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 transition-all"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>

                {isExpanded && isSelected && (
                  <div className="ml-6 space-y-0.5 mt-1">
                    {folderDocs.length > 0 ? (
                      folderDocs.map((doc, docIndex) => {
                        const color = getFileColor(docIndex);
                        const isActive = activeDoc?.id === doc.id;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => handleOpen(doc)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 group
                              ${isActive
                                ? "bg-white dark:bg-gray-800 shadow-sm border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400"
                                : "hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                              }`}
                          >
                            <span className={`p-1 rounded ${color.bg} shrink-0`}>
                              <MdInsertDriveFile size={14} className={color.text} />
                            </span>
                            <span className="truncate flex-1">{doc.title}</span>
                            <span
                              role="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 transition-all"
                            >
                              <MdDelete size={14} />
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-600 px-3 py-2">No documents</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {docs.length === 0 && folders.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <MdNoteAdd size={32} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No documents yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-600">Click + to create one</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link href="/noteidea" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
            <MdArrowBack size={16} />
            <span>Idea Notes</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeDoc ? (
          <>
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4 shrink-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 text-lg font-semibold bg-transparent text-gray-800 dark:text-white border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-sky-500 dark:focus:border-sky-400 transition-colors px-1 py-1 outline-none"
                placeholder="Enter document name..."
              />
              {selectedFolder && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                  <MdFolder size={12} />
                  {selectedFolder.name}
                </span>
              )}
              <span className="text-xs text-gray-400 hidden sm:block">Ctrl+S to save</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
              >
                <MdSave size={16} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center gap-1 flex-wrap shrink-0">
              <select
                value={currentFontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer min-w-[120px] hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
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
                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer w-20 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={toggleBold}
                title="Bold (Ctrl+B)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("bold")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <strong className="text-sm">B</strong>
              </button>

              <button
                onClick={toggleItalic}
                title="Italic (Ctrl+I)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("italic")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <em className="text-sm">I</em>
              </button>

              <button
                onClick={toggleUnderline}
                title="Underline (Ctrl+U)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("underline")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <u className="text-sm">U</u>
              </button>

              <button
                onClick={toggleStrike}
                title="Strikethrough"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("strikeThrough")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <s className="text-sm">S</s>
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <div className="relative">
                <button
                  onClick={() => colorInputRef.current?.click()}
                  title="Text Color"
                  className="w-8 h-8 flex flex-col items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={() => setTextAlign("left")}
                title="Align Left"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyLeft")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <MdFormatAlignLeft size={18} />
              </button>

              <button
                onClick={() => setTextAlign("center")}
                title="Center"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyCenter")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <MdFormatAlignCenter size={18} />
              </button>

              <button
                onClick={() => setTextAlign("right")}
                title="Align Right"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyRight")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <MdFormatAlignRight size={18} />
              </button>

              <button
                onClick={() => setTextAlign("justify")}
                title="Justify"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyFull")
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <MdFormatAlignJustify size={18} />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={toggleBulletList}
                title="Bullet List"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${isBulletList
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <MdFormatListBulleted size={18} />
              </button>

              <button
                onClick={toggleOrderedList}
                title="Numbered List"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${isOrderedList
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 ring-2 ring-sky-300 dark:ring-sky-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
              >
                <MdFormatListNumbered size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 p-8 flex justify-center">
              <div
                ref={editorContainerRef}
                className="bg-white shadow-2xl shrink-0 tiptap-editor-container rounded-2xl overflow-hidden"
                style={{
                  width: "794px",
                  minHeight: "1123px",
                }}
              >
                <div onKeyDown={handleKeyDown}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </>
        ) : selectedFolderId ? (
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${getFolderColor(folders.findIndex(f => f.id === selectedFolderId)).bg}`}>
                  <MdFolderOpen size={24} className={getFolderColor(folders.findIndex(f => f.id === selectedFolderId)).text} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedFolder?.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{displayedDocs.length} documents</p>
                </div>
              </div>

              {displayedDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedDocs.map((doc, index) => {
                    const color = getFileColor(index);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleOpen(doc)}
                        className={`group relative p-5 rounded-2xl ${color.bg} border-2 ${color.border} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm`}>
                            <MdDescription size={20} className={color.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1">{doc.title}</h3>
                            {doc.updated_at && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(doc.updated_at)}</p>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl ${getFolderColor(folders.findIndex(f => f.id === selectedFolderId)).bg} flex items-center justify-center`}>
                    <MdDescription size={40} className={getFolderColor(folders.findIndex(f => f.id === selectedFolderId)).text} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No documents in this folder</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a new document to add it to this folder</p>
                  <button
                    onClick={handleNew}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
                  >
                    <MdAdd size={18} /> New Document
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/40 dark:to-sky-800/30">
                    <MdGridView size={24} className="text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">All Documents</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{docs.length} documents</p>
                  </div>
                </div>
                <button
                  onClick={handleNew}
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
                >
                  <MdAdd size={18} /> New Document
                </button>
              </div>

              {docs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {docs.map((doc, index) => {
                    const color = getFileColor(index);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleOpen(doc)}
                        className={`group relative p-5 rounded-2xl ${color.bg} border-2 ${color.border} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-left`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm`}>
                            <MdDescription size={22} className={color.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1">{doc.title}</h3>
                            {doc.updated_at && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(doc.updated_at)}</p>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/20 flex items-center justify-center">
                    <MdNoteAdd size={48} className="text-sky-400" />
                  </div>
                  <p className="text-2xl font-bold mb-2 text-gray-600 dark:text-gray-400">No documents yet</p>
                  <p className="text-sm mb-8 text-center text-gray-400 dark:text-gray-500 max-w-md mx-auto">Create your first document to get started</p>
                  <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
                  >
                    <MdAdd size={20} /> New Document
                  </button>
                </div>
              )}
            </div>
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
