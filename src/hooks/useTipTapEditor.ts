"use client";
import { Extension } from "@tiptap/core";
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
import { useState, useCallback, useEffect, useRef } from "react";

// Carries the active font size into each new paragraph, like MS Word.
// Runs at priority 150 so it intercepts Enter before list extensions (100).
const FontSizePersistExtension = Extension.create({
  name: "fontSizePersist",
  priority: 150,
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // Let list extensions handle Enter inside list items
        if (editor.isActive("listItem")) return false;

        // Read font size from cursor's text attributes
        const attrSize = editor.getAttributes("textStyle").fontSize as string | undefined;

        // Also check stored marks (set when font size applied to empty selection)
        let storedSize: string | undefined;
        const sm = editor.state.storedMarks;
        if (sm) {
          const m = sm.find(mk => mk.type.name === "textStyle");
          if (m) storedSize = m.attrs.fontSize as string | undefined;
        }

        const fontSize = attrSize || storedSize;
        if (!fontSize) return false; // No explicit size — default Enter behaviour

        // Split the block (same as pressing Enter normally)
        editor.commands.splitBlock();

        // Re-apply font size as stored mark so the first typed character in the
        // new paragraph inherits the same size
        const textStyleType = editor.schema.marks.textStyle;
        if (textStyleType) {
          editor.view.dispatch(
            editor.state.tr.addStoredMark(textStyleType.create({ fontSize }))
          );
        }
        return true;
      },
    };
  },
});

export function useTipTapEditor() {
  const [currentFontFamily, setCurrentFontFamily] = useState("EB Garamond");
  const [currentFontSize, setCurrentFontSize] = useState("16");
  // Tracks the user's intentional font size across cursor moves and paragraph breaks
  const pendingFontSizeRef = useRef("16");
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
      FontSizePersistExtension,
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
    editorProps: {
      transformPastedHTML: (html: string) => {
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove background colors and other unwanted styles from all elements
        const allElements = doc.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            // Preserve formatting before clearing styles
            const textColor = el.style.color;
            const fontSize = el.style.fontSize;
            const fontWeight = el.style.fontWeight;
            const fontStyle = el.style.fontStyle;
            const textDecoration = el.style.textDecoration;

            el.removeAttribute('style');
            el.removeAttribute('class');
            el.removeAttribute('bgcolor');
            el.removeAttribute('background');
            el.style.background = 'transparent';
            el.style.backgroundColor = 'transparent';

            // Restore font size so copied text keeps its size when pasted
            if (fontSize) {
              el.style.fontSize = fontSize;
            }
            if (fontWeight && fontWeight !== 'normal' && fontWeight !== '400') {
              el.style.fontWeight = fontWeight;
            }
            if (fontStyle && fontStyle !== 'normal') {
              el.style.fontStyle = fontStyle;
            }
            if (textDecoration && textDecoration !== 'none') {
              el.style.textDecoration = textDecoration;
            }

            // Restore text color if dark enough to be visible on white
            if (textColor) {
              const rgb = textColor.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                if (r < 200 || g < 200 || b < 200) {
                  el.style.color = textColor;
                } else {
                  el.style.color = '#000000';
                }
              }
            }
          }
        });

        // Return the cleaned HTML
        return doc.body.innerHTML;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        // Handle image paste
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: base64 })
                  )
                );
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
    },
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

    // Get current font size from cursor position
    const fontSize = ed.getAttributes("textStyle").fontSize as string | undefined;
    if (fontSize) {
      const numSize = fontSize.replace("px", "");
      setCurrentFontSize(numSize);
      pendingFontSizeRef.current = numSize; // Keep pending in sync with explicit text
    } else {
      // Cursor on text with no explicit size — display the user's last chosen size
      setCurrentFontSize(pendingFontSizeRef.current);
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
      "EB Garamond": "var(--font-eb-garamond), Georgia, serif",
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
    pendingFontSizeRef.current = size;
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

  const insertPageBreak = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
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
    insertPageBreak,
  };
}
