"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAlert } from "@/hooks/useAlert";
import {
  MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatStrikethrough,
  MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdFormatAlignJustify,
  MdFormatListBulleted, MdFormatListNumbered,
  MdAdd, MdDelete, MdSave, MdArrowBack, MdNoteAdd, MdInsertDriveFile,
  MdFolder, MdFolderOpen, MdCreateNewFolder, MdExpandMore, MdChevronRight,
  MdGridView, MdDescription, MdImage, MdLink,
} from "react-icons/md";
import { LuFileDown } from "react-icons/lu";
import { useTipTapEditor } from "@/hooks/useTipTapEditor";
import { EditorContent } from "@tiptap/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const router = useRouter();
  const { showAlert } = useAlert();
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetFolder, setMoveTargetFolder] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageContextMenu, setImageContextMenu] = useState<{ x: number; y: number; src: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: "folder" | "file"; id: string | number } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ type: "folder" | "file"; id: string | number } | null>(null);
  const [pages, setPages] = useState<string[]>([""]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeEditorTools, setActiveEditorTools] = useState<any>(null);

  const editorContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeDocIdRef = useRef<number | null>(null);

  const {
    editor: globalEditor,
    EditorContent,
    currentFontFamily: globalFontFamily,
    currentFontSize: globalFontSize,
    isBulletList: globalBulletList,
    isOrderedList: globalOrderedList,
    activeFormats: globalActiveFormats,
    toggleBold: globalToggleBold,
    toggleItalic: globalToggleItalic,
    toggleUnderline: globalToggleUnderline,
    toggleStrike: globalToggleStrike,
    setFontFamily: globalSetFontFamily,
    setFontSize: globalSetFontSize,
    setTextColor: globalSetTextColor,
    setHighlight: globalSetHighlight,
    setTextAlign: globalSetTextAlign,
    toggleBulletList: globalToggleBulletList,
    toggleOrderedList: globalToggleOrderedList,
    handleKeyDown: globalHandleKeyDown,
    insertImage: globalInsertImage,
    insertImageFromFile: globalInsertImageFromFile,
    insertLink: globalInsertLink,
  } = useTipTapEditor();

  const activeTools = activeEditorTools;
  const editor = activeTools?.editor ?? globalEditor;
  const currentFontFamily = activeTools?.currentFontFamily ?? globalFontFamily;
  const currentFontSize = activeTools?.currentFontSize ?? globalFontSize;
  const isBulletList = activeTools?.isBulletList ?? globalBulletList;
  const isOrderedList = activeTools?.isOrderedList ?? globalOrderedList;
  const activeFormats = activeTools?.activeFormats ?? globalActiveFormats;
  const toggleBold = activeTools?.toggleBold ?? globalToggleBold;
  const toggleItalic = activeTools?.toggleItalic ?? globalToggleItalic;
  const toggleUnderline = activeTools?.toggleUnderline ?? globalToggleUnderline;
  const toggleStrike = activeTools?.toggleStrike ?? globalToggleStrike;
  const setFontFamily = activeTools?.setFontFamily ?? globalSetFontFamily;
  const setFontSize = activeTools?.setFontSize ?? globalSetFontSize;
  const setTextColor = activeTools?.setTextColor ?? globalSetTextColor;
  const setHighlight = activeTools?.setHighlight ?? globalSetHighlight;
  const setTextAlign = activeTools?.setTextAlign ?? globalSetTextAlign;
  const toggleBulletList = activeTools?.toggleBulletList ?? globalToggleBulletList;
  const toggleOrderedList = activeTools?.toggleOrderedList ?? globalToggleOrderedList;
  const handleKeyDown = activeTools?.handleKeyDown ?? globalHandleKeyDown;
  const insertImage = activeTools?.insertImage ?? globalInsertImage;
  const insertImageFromFile = activeTools?.insertImageFromFile ?? globalInsertImageFromFile;
  const insertLink = activeTools?.insertLink ?? globalInsertLink;

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

  const handlePageUpdate = (index: number, content: string) => {
    setPages(prev => {
      const next = [...prev];
      next[index] = content;
      return next;
    });
  };

  const addNewPage = () => {
    setPages(prev => {
      const newIndex = prev.length;
      setActivePageIndex(newIndex);
      return [...prev, ""];
    });
  };

  const exportToPDF = useCallback(async () => {
    if (!title.trim()) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const pageContainer = document.querySelector(`[data-page-index="${i}"]`);
        if (!pageContainer) continue;
        const element = pageContainer.querySelector('.ProseMirror');
        if (!element) continue;
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10;
        pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      }
      pdf.save(`${title || "document"}.pdf`);
      toast.success("PDF exported successfully!");
      setShowExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }, [title, pages]);

  const exportToText = useCallback(() => {
    if (!editor || !title.trim()) return;
    try {
      const content = editor.getText();
      const blob = new Blob([`${title}\n\n${content}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "document"}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Text file exported successfully!");
      setShowExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export text file");
    }
  }, [editor, title]);

  const createFolder = useCallback(async () => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to create a folder.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
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
  }, [user, newFolderName, loadFolders, showAlert]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to delete folders.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
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
  }, [user, selectedFolderId, loadDocs, showAlert]);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, type: "folder" | "file", id: string | number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const renameFolder = useCallback(async () => {
    if (!user || !renameTarget || renameTarget.type !== "folder" || !renameValue.trim()) return;
    try {
      const res = await fetch(
        `/api/folders?id=${renameTarget.id}&email=${encodeURIComponent(user.email)}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renameValue.trim() }) }
      );
      if (res.ok) {
        await loadFolders(user.email);
        setShowRenameModal(false);
        setRenameValue("");
        setRenameTarget(null);
        toast.success("Folder renamed");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to rename folder");
      }
    } catch { toast.error("Failed to rename folder"); }
  }, [user, renameTarget, renameValue, loadFolders]);

  const renameDoc = useCallback(async () => {
    if (!user || !renameTarget || renameTarget.type !== "file" || !renameValue.trim()) return;
    try {
      const res = await fetch(
        `/api/documents?id=${renameTarget.id}&email=${encodeURIComponent(user.email)}`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: renameValue.trim() }) }
      );
      if (res.ok) {
        await loadDocs(user.email);
        if (activeDoc && activeDoc.id === renameTarget.id) {
          setTitle(renameValue.trim());
          setActiveDoc({ ...activeDoc, title: renameValue.trim() });
        }
        setShowRenameModal(false);
        setRenameValue("");
        setRenameTarget(null);
        toast.success("Document renamed");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to rename document");
      }
    } catch { toast.error("Failed to rename document"); }
  }, [user, renameTarget, renameValue, loadDocs, activeDoc]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

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
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to save documents.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
    if (!user?.email) return;
    setSaving(true);
    try {
      const content = doc.content || "";
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
  }, [user, loadDocs, editor, showAlert]);

  const handleSave = useCallback(() => {
    if (!activeDoc) return;
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to save documents.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
    const fullContent = pages.join("<!-- PAGE_BREAK -->");
    const updated: Doc = { ...activeDoc, title, content: fullContent };
    setActiveDoc(updated);
    saveDoc(updated);
  }, [activeDoc, title, pages, saveDoc, user, showAlert]);

  const handleNew = () => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to create documents.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
    const doc: Doc = { id: Date.now(), title: "Untitled Document", content: "", folder_id: selectedFolderId };
    setActiveDoc(doc);
    setTitle(doc.title);
    setPages([""]);
    setActivePageIndex(0);
    editorContainerRefs.current = [];
  };

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

  const handleOpen = async (doc: Doc) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to open documents.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
    activeDocIdRef.current = doc.id;
    setActiveDoc(doc);
    setTitle(doc.title);
    setPages(["<p>Loading...</p>"]);

    if (!user?.email) return;

    try {
      const res = await fetch(`/api/documents?email=${encodeURIComponent(user.email)}&id=${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        const fullDoc = data.document;
        if (fullDoc && activeDocIdRef.current === doc.id) {
          setActiveDoc(fullDoc);
          const content = fullDoc.content || "";
          if (content.includes("<!-- PAGE_BREAK -->")) {
            setPages(content.split("<!-- PAGE_BREAK -->"));
          } else {
            setPages([content]);
          }
          setActivePageIndex(0);
          editorContainerRefs.current = [];
        }
      }
    } catch (err) {
      console.error("Failed to load document content", err);
      toast.error("Failed to load document content");
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      showAlert({
        title: "Login Required",
        message: "Please login to delete documents.",
        type: "warning",
        confirmText: "Login",
        linkToLogin: true,
      });
      return;
    }
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

  const [textColorPreview, setTextColorPreview] = useState("#000000");
  const [highlightColorPreview, setHighlightColorPreview] = useState("#ffff00");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-linear-to-b from-gray-900 to-gray-600 overflow-hidden font-serif">
      <div className="w-64 sm:w-72 shrink-0 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col max-md:hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">My Workspace</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (!user) {
                    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
                    showAlert({
                      title: "Login Required",
                      message: "Please login to create folders.",
                      type: "warning",
                      confirmText: "Login",
                      linkToLogin: true,
                    });
                    return;
                  }
                  setShowNewFolderInput(true);
                }}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-sky-400 transition-all"
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
                className="w-full text-sm px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-gray-500"
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
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
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
                ? "bg-white/10 text-white border border-white/20"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
          >
            <MdGridView size={18} />
            <span>All Documents</span>
            <span className="ml-auto text-xs bg-white/10 text-white px-2 py-0.5 rounded-full">{docs.length}</span>
          </button>

          <div className="border-t border-gray-100 dark:border-gray-800 my-3" />

          <div className="flex items-center gap-2 px-3 mb-2">
            <p className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Folders</p>
            <span className="text-[11px] text-gray-400">{folders.length}</span>
          </div>

          {folders.map((folder, index) => {
            const folderDocs = docs.filter((d) => d.folder_id === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const folderColor = getFolderColor(index);
            const isSelected = selectedFolderId === folder.id;

            return (
              <div key={folder.id} className="space-y-0.5">
                <button
                  onClick={() => { setSelectedFolderId(folder.id); setActiveDoc(null); toggleFolderExpand(folder.id); }}
                  onContextMenu={(e) => handleContextMenu(e, "folder", folder.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 group
                    ${isSelected
                      ? "bg-white/15 text-white border border-white/20 shadow-sm"
                      : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
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
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-white/5 text-gray-300"} group-hover:bg-white/10 transition-colors`}>
                    {folderDocs.length}
                  </span>
                </button>

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
                            onContextMenu={(e) => handleContextMenu(e, "file", doc.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 group
                              ${isActive
                                ? "bg-white/10 shadow-sm border border-white/20 text-white"
                                : "hover:bg-white/5 text-gray-300 hover:text-white"
                              }`}
                          >
                            <span className={`p-1 rounded ${color.bg} shrink-0`}>
                              <MdInsertDriveFile size={14} className={color.text} />
                            </span>
                            <span className="truncate flex-1">{doc.title}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 px-3 py-2">No documents</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {docs.length === 0 && folders.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <MdNoteAdd size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-300 mb-1">No documents yet</p>
              <p className="text-xs text-gray-400">Click + to create one</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link href="/noteidea" className="flex items-center gap-2 text-sm text-gray-300 hover:text-sky-400 transition-colors">
            <MdArrowBack size={16} />
            <span>Idea Notes</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeDoc ? (
          <>
            <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4 shrink-0">
              {selectedFolder && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800">
                  <MdFolder size={14} />
                  {selectedFolder.name}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">Ctrl+S to save</span>
                <button
                  onClick={() => { setMoveTargetFolder(activeDoc?.folder_id || null); setShowMoveModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-all border border-white/10"
                >
                  <MdFolder size={16} />
                  Move
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-all border border-white/10"
                >
                  <LuFileDown size={16} />
                  Export
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all"
                >
                  <MdSave size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-2 py-2 flex items-center gap-1 flex-nowrap overflow-x-auto shrink-0">
              <select
                value={currentFontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none cursor-pointer min-w-[120px] hover:border-white/20 transition-colors"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }} className="bg-gray-900 text-white">
                    {font.label}
                  </option>
                ))}
              </select>

              <select
                value={currentFontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none cursor-pointer w-20 hover:border-white/20 transition-colors"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s} className="bg-gray-900 text-white">{s}px</option>
                ))}
              </select>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={toggleBold}
                title="Bold (Ctrl+B)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("bold")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <strong className="text-sm">B</strong>
              </button>

              <button
                onClick={toggleItalic}
                title="Italic (Ctrl+I)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("italic")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <em className="text-sm">I</em>
              </button>

              <button
                onClick={toggleUnderline}
                title="Underline (Ctrl+U)"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("underline")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <u className="text-sm">U</u>
              </button>

              <button
                onClick={toggleStrike}
                title="Strikethrough"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("strikeThrough")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <s className="text-sm">S</s>
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <div className="relative">
                <button
                  onClick={() => colorInputRef.current?.click()}
                  title="Text Color"
                  className="w-8 h-8 flex flex-col items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-bold text-white leading-none">A</span>
                  <span className="w-5 h-1.5 rounded-sm mt-0.5 shadow-sm border border-white/10" style={{ backgroundColor: textColorPreview }} />
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={textColorPreview}
                  onChange={(e) => { setTextColorPreview(e.target.value); setTextColor(e.target.value); }}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => highlightInputRef.current?.click()}
                  title="Highlight Color"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs font-bold px-1 py-0.5 rounded shadow-sm" style={{ backgroundColor: highlightColorPreview, color: "#000" }}>
                    H
                  </span>
                </button>
                <input
                  ref={highlightInputRef}
                  type="color"
                  value={highlightColorPreview}
                  onChange={(e) => { setHighlightColorPreview(e.target.value); setHighlight(e.target.value); }}
                  className="absolute opacity-0 w-0 h-0 pointer-events-none"
                />
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={() => setTextAlign("left")}
                title="Align Left"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyLeft")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <MdFormatAlignLeft size={18} />
              </button>

              <button
                onClick={() => setTextAlign("center")}
                title="Center"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyCenter")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <MdFormatAlignCenter size={18} />
              </button>

              <button
                onClick={() => setTextAlign("right")}
                title="Align Right"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyRight")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <MdFormatAlignRight size={18} />
              </button>

              <button
                onClick={() => setTextAlign("justify")}
                title="Justify"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${activeFormats.has("justifyFull")
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <MdFormatAlignJustify size={18} />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={toggleBulletList}
                title="Bullet List"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${isBulletList
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <MdFormatListBulleted size={18} />
              </button>

              <button
                onClick={toggleOrderedList}
                title="Numbered List"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                  ${isOrderedList
                    ? "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/50"
                    : "hover:bg-white/5 text-gray-300 hover:text-white"}`}
              >
                <MdFormatListNumbered size={18} />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={() => setShowImageModal(true)}
                title="Insert Image"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all"
              >
                <MdImage size={18} />
              </button>

              <button
                onClick={() => setShowLinkModal(true)}
                title="Insert Link"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-all"
              >
                <MdLink size={18} />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={addNewPage}
                title="Add New Paper (Page Break)"
                className="h-8 px-2 flex items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 text-sky-400 hover:text-sky-300 transition-all"
              >
                <MdNoteAdd size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider">New Paper</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-10">
              {pages.map((pageContent, index) => (
                <NoteSheet
                  key={`${activeDoc?.id || "new"}-${index}`}
                  index={index}
                  content={pageContent}
                  onUpdate={handlePageUpdate}
                  onFocus={(tools) => setActiveEditorTools(tools)}
                  isFirst={index === 0}
                  title={title}
                  setTitle={setTitle}
                />
              ))}
            </div>
          </>
        ) : selectedFolderId ? (
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${getFolderColor(folders.findIndex(f => f.id === selectedFolderId)).bg}`}>
                  <MdFolderOpen size={24} className={getFolderColor(folders.findIndex(f => f.id === selectedFolderId)).text} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedFolder?.name}</h2>
                  <p className="text-sm text-gray-300">{displayedDocs.length} documents</p>
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
          <div className="flex-1 overflow-auto bg-transparent p-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/40 dark:to-sky-800/30">
                    <MdGridView size={24} className="text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">All Documents</h2>
                    <p className="text-sm text-gray-300">{docs.length} documents</p>
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
                        onContextMenu={(e) => handleContextMenu(e, "file", doc.id)}
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
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/30 dark:to-sky-800/20 flex items-center justify-center">
                    <MdNoteAdd size={48} className="text-sky-400" />
                  </div>
                  <p className="text-2xl font-bold mb-2 text-white">No documents yet</p>
                  <p className="text-sm mb-8 text-center text-gray-300 max-w-md mx-auto">Create your first document to get started</p>
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
.tiptap-paper-sheet .ProseMirror {
          outline: none;
          padding: 60px 100px;
          font-size: 16px;
          line-height: 1.4;
          min-height: 1100px;
          font-family: Georgia, 'Times New Roman', serif;
        }
        .tiptap-paper-sheet .ProseMirror:focus {
          outline: none;
        }
        @media (max-width: 768px) {
          .tiptap-paper-sheet .ProseMirror {
            padding: 16px;
            min-height: 700px;
          }
          .tiptap-paper-sheet .ProseMirror h1 { font-size: 24px; }
          .tiptap-paper-sheet .ProseMirror h2 { font-size: 20px; }
          .tiptap-paper-sheet .ProseMirror h3 { font-size: 18px; }
        }
        .tiptap-paper-sheet .ProseMirror p {
          margin: 0 0 0.5em 0;
        }
        .tiptap-paper-sheet .ProseMirror ul,
        .tiptap-paper-sheet .ProseMirror ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }
        .tiptap-paper-sheet .ProseMirror li {
          margin: 0.25em 0;
        }
        .tiptap-paper-sheet .ProseMirror ul li {
          list-style-type: disc;
        }
        .tiptap-paper-sheet .ProseMirror ol li {
          list-style-type: decimal;
        }
        .tiptap-paper-sheet .ProseMirror ul ul li {
          list-style-type: circle;
        }
        .tiptap-paper-sheet .ProseMirror ol ol li {
          list-style-type: lower-alpha;
        }
        .tiptap-paper-sheet .ProseMirror blockquote {
          border-left: 4px solid #38bdf8;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #64748b;
        }
        .tiptap-paper-sheet .ProseMirror pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          font-family: monospace;
          overflow: auto;
        }
        .tiptap-paper-sheet .ProseMirror code {
          background: #f1f5f9;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
        .tiptap-paper-sheet .ProseMirror hr {
          border: none;
          height: 48px;
          margin: 48px -80px;
          background: #111827; /* Dark workspace background */
          position: relative;
          cursor: default;
        }
        .tiptap-paper-sheet .ProseMirror hr::before {
          content: '';
          position: absolute;
          top: -15px;
          left: 0;
          right: 0;
          height: 15px;
          background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
          pointer-events: none;
        }
        .tiptap-paper-sheet .ProseMirror hr::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 0;
          right: 0;
          height: 15px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.15), transparent);
          pointer-events: none;
        }
        .tiptap-paper-sheet .ProseMirror hr::before {
          content: 'PAGE BREAK';
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: transparent;
          font-size: 9px;
          font-weight: 800;
          color: #374151;
          letter-spacing: 0.3em;
          opacity: 0.5;
        }
        .tiptap-paper-sheet .ProseMirror h1 {
          font-size: 32px;
          font-weight: bold;
          margin: 24px 0 16px;
        }
        .tiptap-paper-sheet .ProseMirror h2 {
          font-size: 24px;
          font-weight: bold;
          margin: 20px 0 12px;
        }
        .tiptap-paper-sheet .ProseMirror h3 {
          font-size: 20px;
          font-weight: bold;
          margin: 16px 0 8px;
        }
        .tiptap-paper-sheet .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
          cursor: pointer;
        }
        .tiptap-paper-sheet .ProseMirror a {
          color: #0ea5e9;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-paper-sheet .ProseMirror a:hover {
          color: #0284c7;
        }
      `}</style>

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[90%] max-w-md p-6 flex flex-col gap-4 border border-white/10">
            <h2 className="text-lg font-bold text-white">Insert Image</h2>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-gray-300">Click to upload image</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    insertImageFromFile(file);
                    setShowImageModal(false);
                  }
                }}
              />
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600" />
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL..."
              className="w-full text-sm px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-gray-500"
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setShowImageModal(false); setImageUrl(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 font-medium transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => { insertImage(imageUrl); setShowImageModal(false); setImageUrl(""); }}
                disabled={!imageUrl.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold shadow-lg shadow-sky-500/25 transition-colors"
              >
                Insert URL
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[90%] max-w-md p-6 flex flex-col gap-4 border border-white/10">
            <h2 className="text-lg font-bold text-white">Insert Link</h2>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste URL (e.g., https://example.com)..."
              className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              autoFocus
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setShowLinkModal(false); setLinkUrl(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (linkUrl.trim()) {
                    editor?.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-sky-500 underline hover:text-sky-600">${linkUrl}</a>`).run();
                    setShowLinkModal(false);
                    setLinkUrl("");
                  }
                }}
                disabled={!linkUrl.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold shadow-lg shadow-sky-500/25 transition-colors"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col gap-4 border border-white/10">
            <h2 className="text-lg font-bold text-white">Export Document</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose a format to export your document</p>
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="flex items-center gap-3 px-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-500 text-lg font-bold">PDF</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Export as PDF</p>
                  <p className="text-xs text-gray-500">Preserves formatting and images</p>
                </div>
              </button>
              <button
                onClick={exportToText}
                className="flex items-center gap-3 px-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-500 text-lg font-bold">TXT</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Export as Text</p>
                  <p className="text-xs text-gray-500">Plain text file</p>
                </div>
              </button>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col gap-4 border border-white/10">
            <h2 className="text-lg font-bold text-white">Move Document</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a folder to move this document to</p>
            
            <div className="flex flex-col gap-2 mt-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => setMoveTargetFolder(null)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                  moveTargetFolder === null
                    ? "bg-sky-500/20 border-sky-500 text-sky-400"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <MdFolder size={20} className="text-gray-400" />
                <span className="text-sm font-medium">No Folder</span>
              </button>

              {folders.map((folder, index) => {
                const folderColor = getFolderColor(index);
                const isSelected = moveTargetFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setMoveTargetFolder(folder.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      isSelected
                        ? "bg-sky-500/20 border-sky-500"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg ${folderColor.bg}`}>
                      <MdFolder size={18} className={folderColor.text} />
                    </span>
                    <span className={`text-sm font-medium ${isSelected ? "text-sky-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {folder.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {folders.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No folders available</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user?.email || !activeDoc) return;
                  try {
                    const updatedDoc = { ...activeDoc, folder_id: moveTargetFolder };
                    const res = await fetch("/api/documents", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email, document: updatedDoc }),
                    });
                    if (res.ok) {
                      setActiveDoc(updatedDoc);
                      await loadDocs(user.email);
                      setSelectedFolderId(moveTargetFolder);
                      toast.success("Document moved successfully");
                      setShowMoveModal(false);
                    } else {
                      toast.error("Failed to move document");
                    }
                  } catch {
                    toast.error("Failed to move document");
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              if (contextMenu.type === "folder") {
                const folder = folders.find(f => f.id === contextMenu.id);
                setRenameTarget({ type: "folder", id: contextMenu.id });
                setRenameValue(folder?.name || "");
              } else {
                const doc = docs.find(d => d.id === contextMenu.id);
                setRenameTarget({ type: "file", id: contextMenu.id });
                setRenameValue(doc?.title || "");
              }
              setShowRenameModal(true);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <MdCreateNewFolder size={16} />
            Rename
          </button>
          <button
            onClick={async () => {
              if (contextMenu.type === "folder") {
                await deleteFolder(contextMenu.id as string);
              } else {
                await handleDelete(contextMenu.id as number);
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
          >
            <MdDelete size={16} />
            Delete
          </button>
        </div>
      )}

      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Rename {renameTarget?.type === "folder" ? "Folder" : "Document"}
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { renameTarget?.type === "folder" ? renameFolder() : renameDoc(); } }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRenameModal(false); setRenameValue(""); setRenameTarget(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { renameTarget?.type === "folder" ? renameFolder() : renameDoc(); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Multi-page support */}
      {activeDoc && (
        <button
          onClick={addNewPage}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white rounded-full shadow-[0_8px_30px_rgb(14,165,233,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40 group border border-white/20"
          title="Add New Paper"
        >
          <MdAdd size={30} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900/80 backdrop-blur-md text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
            Add New Paper
          </span>
        </button>
      )}
    </div>
  );
}

interface NoteSheetProps {
  index: number;
  content: string;
  onUpdate: (index: number, content: string) => void;
  onFocus: (tools: any) => void;
  isFirst: boolean;
  title: string;
  setTitle: (title: string) => void;
}

function NoteSheet({ index, content, onUpdate, onFocus, isFirst, title, setTitle }: NoteSheetProps) {
  const tools = useTipTapEditor();
  const { editor, EditorContent, handleKeyDown } = tools;
  const indexRef = useRef(index);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(sanitizeHtml(content));
    }
  }, [editor, content]);

  useEffect(() => {
    if (!editor) return;
    const updateHandler = () => {
      onUpdate(indexRef.current, editor.getHTML());
    };
    editor.on('update', updateHandler);
    return () => { editor.off('update', updateHandler); };
  }, [editor, onUpdate]);

  const handleInternalFocus = () => {
    onFocus(tools);
  };

  useEffect(() => {
    if (isFirst && editor) {
      onFocus(tools);
    }
  }, [isFirst, !!editor]);

  return (
    <div
      data-page-index={index}
      className="tiptap-paper-sheet bg-white shadow-2xl shrink-0 w-[900px] min-h-[1200px] relative flex flex-col transition-all duration-300 hover:shadow-sky-500/10"
      onClick={handleInternalFocus}
    >
      {isFirst && (
        <div className="text-center px-4 sm:px-8 pt-10 pb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-center text-4xl font-bold bg-transparent text-gray-800 border-b-2 border-transparent hover:border-gray-200 focus:border-sky-500 transition-all px-1 py-4 outline-none font-serif tracking-tight"
            placeholder="Document Title"
          />
        </div>
      )}
      <div className="flex-1" onKeyDown={handleKeyDown}>
        <EditorContent editor={editor} className="h-full" />
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] opacity-50 select-none">
        Page {index + 1}
      </div>
    </div>
  );
}
