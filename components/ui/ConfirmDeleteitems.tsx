"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface ConfirmDeleteButtonProps {
  itemName: string
  itemId: string | number
  onDelete: (id: string | number) => void | Promise<void>
  variant?: "destructive" | "outline" | "default"
  children?: React.ReactNode
}

export function ConfirmDeleteButton({
  itemName,
  itemId,
  onDelete,
  variant = "destructive",
  children = "Delete",
}: ConfirmDeleteButtonProps) {
  const handleConfirm = async () => {
    try {
      await onDelete(itemId)
      toast.success(`"${itemName}" deleted successfully!`)
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(`Failed to delete "${itemName}"`)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          className="cursor-pointer flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {children}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent
        className="p-0 overflow-hidden border-0 shadow-2xl max-w-md rounded-2xl"
        style={{
          background: "var(--color-surface)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Red accent top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-400 to-rose-500" />

        <div className="px-6 pb-6 pt-5">
          <AlertDialogHeader className="items-center text-center gap-3">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 mx-auto">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>

            <div className="space-y-1.5">
              <AlertDialogTitle
                className="text-lg font-semibold tracking-tight"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
              >
                Delete this item?
              </AlertDialogTitle>
              <AlertDialogDescription
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-sans)" }}
              >
                You&apos;re about to permanently delete{" "}
                <span
                  className="font-semibold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600"
                >
                  &quot;{itemName}&quot;
                </span>
                . This action{" "}
                <span className="font-semibold text-gray-700">cannot be undone</span>.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <AlertDialogCancel
              className="flex-1 cursor-pointer rounded-xl border text-sm font-medium transition-all duration-200 hover:bg-gray-50 active:scale-95"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-cancel)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="flex-1 cursor-pointer flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <Trash2 className="w-4 h-4" />
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
