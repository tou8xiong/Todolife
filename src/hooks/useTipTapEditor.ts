"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-text-style/font-size";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { FontFamily } from "@tiptap/extension-font-family";
import { BulletList, OrderedList } from "@tiptap/extension-list";
import ListItem from "@tiptap/extension-list-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useState, useCallback, useEffect } from "react";

export function useTipTapEditor() {
  const [currentFontFamily, setCurrentFontFamily] = useState("Georgia");
  const [currentFontSize, setCurrentFontSize] = useState("16");
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentHighlightColor, setCurrentHighlightColor] = useState("#ffff00");
  const [isBulletList, setIsBulletList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      BulletList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      ListItem,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg cursor-pointer max-w-full",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-sky-500 underline hover:text-sky-600 cursor-pointer",
        },
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      updateStates(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateStates(editor);
    },
    onTransaction: ({ editor }) => {
      updateStates(editor);
    },
  });

  const updateStates = useCallback((ed: typeof editor) => {
    if (!ed) return;

    // Check list states
    setIsBulletList(ed.isActive("bulletList"));
    setIsOrderedList(ed.isActive("orderedList"));

    // Check format states
    const formats = new Set<string>();
    if (ed.isActive("bold")) formats.add("bold");
    if (ed.isActive("italic")) formats.add("italic");
    if (ed.isActive("underline")) formats.add("underline");
    if (ed.isActive("strike")) formats.add("strikeThrough");
    if (ed.isActive({ textAlign: "left" })) formats.add("justifyLeft");
    if (ed.isActive({ textAlign: "center" })) formats.add("justifyCenter");
    if (ed.isActive({ textAlign: "right" })) formats.add("justifyRight");
    if (ed.isActive({ textAlign: "justify" })) formats.add("justifyFull");
    setActiveFormats(formats);

    // Get current font family
    const fontFamily = ed.getAttributes("textStyle").fontFamily;
    if (fontFamily) {
      // Extract just the font name (e.g., "Georgia, serif" -> "Georgia")
      const fontName = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      setCurrentFontFamily(fontName);
    }

    // Get current font size
    const fontSize = ed.getAttributes("textStyle").fontSize;
    if (fontSize) {
      setCurrentFontSize(fontSize.replace("px", ""));
    }
  }, []);

  useEffect(() => {
    if (editor) {
      updateStates(editor);
    }
  }, [editor, updateStates]);

  // Format commands
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const setFontFamily = useCallback((fontFamily: string) => {
    const fontMap: { [key: string]: string } = {
      "Georgia": "Georgia, serif",
      "Arial": "Arial, sans-serif",
      "Helvetica": "Helvetica, Arial, sans-serif",
      "Times New Roman": "'Times New Roman', Times, serif",
      "Courier New": "'Courier New', Courier, monospace",
      "Verdana": "Verdana, Geneva, sans-serif",
      "Trebuchet MS": "'Trebuchet MS', sans-serif",
      "Impact": "Impact, sans-serif",
      "Comic Sans MS": "'Comic Sans MS', cursive, sans-serif",
    };
    const fullFont = fontMap[fontFamily] || fontFamily;
    editor?.chain().focus().setFontFamily(fullFont).run();
    setCurrentFontFamily(fontFamily);
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    editor?.chain().focus().setFontSize(size + "px").run();
    setCurrentFontSize(size);
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    editor?.chain().focus().setColor(color).run();
    setCurrentTextColor(color);
  }, [editor]);

  const setHighlight = useCallback((color: string) => {
    editor?.chain().focus().toggleHighlight({ color }).run();
    setCurrentHighlightColor(color);
  }, [editor]);

  const setTextAlign = useCallback((align: "left" | "center" | "right" | "justify") => {
    editor?.chain().focus().setTextAlign(align).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editor) return;

    // Handle Tab for list indentation
    if (e.key === "Tab") {
      if (isBulletList || isOrderedList) {
        e.preventDefault();
        if (e.shiftKey) {
          editor.chain().focus().liftListItem("listItem").run();
        } else {
          editor.chain().focus().sinkListItem("listItem").run();
        }
      }
    }

    // Handle Enter in empty list items
    if (e.key === "Enter" && !e.shiftKey) {
      const { selection } = editor.state;
      const { $from } = selection;
      
      // Check if we're in an empty list item
      if (isBulletList || isOrderedList) {
        const node = $from.node();
        if (node && node.type.name === "listItem") {
          const text = node.textContent;
          if (text.trim() === "") {
            // Empty list item - exit the list
            e.preventDefault();
            editor.chain().focus().liftListItem("listItem").run();
          }
        }
      }
    }
  }, [editor, isBulletList, isOrderedList]);

  const insertImage = useCallback((url: string) => {
    if (!url) return;
    editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertImageFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      editor?.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const insertLink = useCallback((url: string, text?: string) => {
    if (!url) return;
    if (text && text.trim()) {
      editor?.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`).run();
    } else {
      editor?.chain().focus().setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
    }
  }, [editor]);

  return {
    editor,
    EditorContent,
    // States
    currentFontFamily,
    currentFontSize,
    currentTextColor,
    currentHighlightColor,
    isBulletList,
    isOrderedList,
    activeFormats,
    // Commands
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
    insertImage,
    insertImageFromFile,
    insertLink,
  };
}
