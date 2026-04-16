"use client";

import { useState, useEffect } from "react";
import { MdFolder } from "react-icons/md";

type ActionType = "rename" | "delete";

interface FolderActionModalProps {
  type: ActionType;
  folderName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export default function FolderActionModal({
  type,
  folderName,
  onClose,
  onRename,
  onDelete,
}: FolderActionModalProps) {
  const [name, setName] = useState(folderName);

  useEffect(() => {
    setName(folderName);
  }, [folderName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (type === "delete") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Delete Folder</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete the folder <strong>"{folderName}"</strong>? All documents inside will also be deleted.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/25 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <MdFolder size={20} className="text-sky-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rename Folder</h2>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onRename(name.trim());
            }
          }}
          placeholder="Enter folder name..."
          className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-all"
          autoFocus
        />
        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onRename(name.trim())}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold shadow-lg shadow-sky-500/25 transition-colors"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
