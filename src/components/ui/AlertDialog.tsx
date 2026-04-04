"use client";

interface AlertDialogProps {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

export default function AlertDialog({ open, title, message, onClose }: AlertDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <h2 className="text-lg font-bold text-red-600">{title}</h2>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
                <button
                    onClick={onClose}
                    className="self-end px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    OK
                </button>
            </div>
        </div>
    );
}
