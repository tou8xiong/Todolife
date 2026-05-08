"use client";
import { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import { Upload, Image as ImageIcon, Copy, Trash2, FileText, Loader2, CheckCircle, Info, Edit2, Save, History, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
    id: string;
    text: string;
    timestamp: number;
    imageName?: string;
}

export default function ImageToText() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState<string>("");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [imageName, setImageName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('ocr-history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error("Failed to load history:", error);
            }
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem('ocr-history', JSON.stringify(history));
        }
    }, [history]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload a valid image file");
                return;
            }

            setImageName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                setSelectedImage(imageData);
                setExtractedText("");
                setProgress(0);
                setIsEditing(false);

                // Auto extract text
                extractTextFromImage(imageData, file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const extractTextFromImage = async (imageData: string, fileName: string) => {
        setIsProcessing(true);
        setProgress(0);

        try {
            const result = await Tesseract.recognize(
                imageData,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            setExtractedText(text);
            setEditedText(text);

            // Add to history
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                text: text,
                timestamp: Date.now(),
                imageName: fileName
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            toast.success("Text extracted successfully!");
        } catch (error) {
            console.error("OCR Error:", error);
            toast.error("Failed to extract text from image");
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        const textToCopy = isEditing ? editedText : extractedText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            toast.success("Text copied to clipboard!");
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedText(extractedText);
    };

    const handleSaveEdit = () => {
        setExtractedText(editedText);
        setIsEditing(false);

        // Update history with edited text
        setHistory(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
                updated[0] = { ...updated[0], text: editedText };
            }
            return updated;
        });

        toast.success("Text updated successfully!");
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedText(extractedText);
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setExtractedText(item.text);
        setEditedText(item.text);
        setIsEditing(true);
        setShowHistory(false);
        toast.success("History item loaded!");
    };

    const deleteHistoryItem = (id: string) => {
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        localStorage.setItem('ocr-history', JSON.stringify(updatedHistory));
        toast.success("History item deleted!");
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('ocr-history');
        toast.success("History cleared!");
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-blue-400" />
                                <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                                    Image to Text
                                </h1>
                                <div className="relative">
                                    <button
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseLeave={() => setShowTooltip(false)}
                                        className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                                    >
                                        <Info className="w-5 h-5 text-blue-400" />
                                    </button>
                                    {showTooltip && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 z-50">
                                            <div className="text-xs text-gray-300 space-y-1">
                                                <p className="font-semibold text-blue-300 mb-2">Tips for better results:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Use clear, high-resolution images</li>
                                                    <li>Ensure good lighting and contrast</li>
                                                    <li>Avoid blurry or distorted images</li>
                                                    <li>Text should be horizontal and readable</li>
                                                </ul>
                                            </div>
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-600"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-all border border-gray-600"
                            >
                                <History className="w-5 h-5 text-blue-400" />
                                <span className="text-sm font-semibold">History</span>
                                {history.length > 0 && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {history.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        <p className="text-gray-300 text-sm sm:text-base">
                            Upload an image and extract text using OCR technology
                        </p>
                    </div>

                    {/* History Panel */}
                    {showHistory ? (
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <History className="w-5 h-5 text-blue-400" />
                                    <h2 className="text-lg sm:text-xl font-bold text-white">
                                        History ({history.length})
                                    </h2>
                                </div>
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-all"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                                {history.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No history yet</p>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all cursor-pointer group"
                                            onClick={() => loadHistoryItem(item)}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </p>
                                                    {item.imageName && (
                                                        <p className="text-xs text-blue-400 mt-1">
                                                            {item.imageName}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteHistoryItem(item.id);
                                                    }}
                                                    className="p-1 rounded hover:bg-red-600 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-gray-300 text-sm line-clamp-3">
                                                {item.text}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Upload Section */}
                            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6 mb-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                    id="image-upload"
                                />

                                {!selectedImage ? (
                                    <label
                                        htmlFor="image-upload"
                                        className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 transition-all duration-300 hover:bg-gray-700/50"
                                    >
                                        <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                                        <p className="text-gray-300 text-base sm:text-lg font-semibold mb-2">
                                            Click to upload image
                                        </p>
                                        <p className="text-gray-500 text-xs sm:text-sm">
                                            PNG, JPG, JPEG up to 10MB
                                        </p>
                                    </label>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative rounded-xl overflow-hidden border border-gray-600">
                                            <img
                                                src={selectedImage}
                                                alt="Uploaded"
                                                className="w-full h-auto max-h-96 object-contain bg-gray-900"
                                            />
                                        </div>

                                        {isProcessing && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-center gap-2 text-blue-400">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span className="text-sm font-semibold">Processing... {progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Extracted Text Section */}
                            {extractedText && (
                                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                            <h2 className="text-lg sm:text-xl font-bold text-white">
                                                Extracted Text
                                            </h2>
                                        </div>
                                        <div className="flex gap-2">
                                            {!isEditing ? (
                                                <>
                                                    <button
                                                        onClick={handleEdit}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md text-sm"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={copyToClipboard}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all shadow-md text-sm"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Copy
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all shadow-md text-sm"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-md text-sm"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600 max-h-96 overflow-y-auto">
                                        {isEditing ? (
                                            <textarea
                                                value={editedText}
                                                onChange={(e) => setEditedText(e.target.value)}
                                                className="w-full min-h-[300px] bg-transparent text-gray-200 text-sm sm:text-base font-mono resize-none focus:outline-none"
                                                placeholder="Edit your text here..."
                                            />
                                        ) : (
                                            <pre className="text-gray-200 text-sm sm:text-base whitespace-pre-wrap font-mono">
                                                {extractedText}
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
