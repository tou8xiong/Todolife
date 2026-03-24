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
      toast.success(`${itemName} deleted successfully!`)
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(`Failed to delete ${itemName}`)
    }
  }

  return (
    <AlertDialog  >
      <AlertDialogTrigger asChild>
        <Button variant={variant} className="bg-red-400 cursor-pointer">
          {children}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>"{itemName}"</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-400 cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 bg-red-300 cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}