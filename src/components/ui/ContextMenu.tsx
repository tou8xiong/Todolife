"use client";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export default function ContextMenu({ x, y, onClose, onRename, onDelete }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] overflow-hidden"
        style={{ top: y, left: x }}
      >
        <button
          onClick={() => { onRename(); onClose(); }}
          className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
        >
          <span className="text-base">✏️</span>
          <span>Rename</span>
        </button>
        <div className="h-px bg-gray-200 dark:bg-gray-700 mx-2" />
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
        >
          <span className="text-base">🗑️</span>
          <span>Delete</span>
        </button>
      </div>
    </>
  );
}
