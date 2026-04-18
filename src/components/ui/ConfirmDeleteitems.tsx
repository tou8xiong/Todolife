"use client";
import React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteButtonProps {
  itemName: string;
  itemId: number | string;
  onDelete: (id: number | string) => void;
  children?: React.ReactNode;
}

export function ConfirmDeleteButton({ itemName, itemId, onDelete, children }: ConfirmDeleteButtonProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        {children ? (
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-semibold transition-colors">
            <Trash2 size={16} />
            {children}
          </button>
        ) : (
          <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-800 bg-gray-900 p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl font-serif">
          <div className="flex flex-col gap-2">
            <AlertDialog.Title className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500">⚠️</span> Are you sure?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-400 leading-relaxed mt-2">
              This action cannot be undone. This will permanently delete{" "}
              <strong className="text-red-400 font-semibold">"{itemName}"</strong> from your tasks
            </AlertDialog.Description>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-4">
            <AlertDialog.Cancel asChild>
              <button className="px-5 py-2.5 rounded-xl font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={() => onDelete(itemId)}
                className="px-5 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all"
              >
                Yes, delete it
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
