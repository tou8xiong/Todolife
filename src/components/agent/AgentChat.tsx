"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import {
  Bot,
  Send,
  Loader2,
  MessageSquare,
  FileText,
  ListTodo,
  AlertCircle,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

type Mode = "chat" | "summarize" | "tasks";

interface Message {
  role: "user" | "assistant";
  content: string;
  taskCreated?: Task;
}

const TASK_CREATE_REGEX = /\[TASK_CREATE\]([\s\S]*?)\[\/TASK_CREATE\]/;

const MODES: {
  id: Mode;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  hint: string;
}[] = [
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      placeholder: "Ask about tasks, or say 'create a task: buy groceries'...",
      hint: "I can read your tasks, show done tasks, and create new ones.",
    },
    {
      id: "summarize",
      label: "Summarize",
      icon: FileText,
      placeholder: "Paste any text here and I'll summarize it...",
      hint: "I'll return 3–5 concise bullet points.",
    },
    {
      id: "tasks",
      label: "Suggest Tasks",
      icon: ListTodo,
      placeholder: "Describe your goal (e.g. 'finish my project this week')...",
      hint: "I'll break it into actionable tasks with priorities.",
    },
  ];

function buildSystemPrompt(mode: Mode, tasks: Task[], today: string): string {
  if (mode === "chat") {
    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);

    const pendingCtx =
      pending.length > 0
        ? `Pending tasks (${pending.length}):\n${pending
          .map(
            (t, i) =>
              `${i + 1}. [${t.type ?? "general"}] ${t.title}${t.priority ? ` (${t.priority} priority)` : ""}${t.date ? `, due ${t.date}` : ""}${t.description ? ` — ${t.description}` : ""}`
          )
          .join("\n")}`
        : "No pending tasks.";

    const doneCtx =
      done.length > 0
        ? `\n\nCompleted tasks (${done.length}):\n${done
          .slice(0, 15)
          .map(
            (t, i) =>
              `${i + 1}. ${t.title}${t.completedAt ? ` (completed ${t.completedAt})` : ""}`
          )
          .join("\n")}`
        : "\n\nNo completed tasks.";

    return `You are a helpful productivity assistant for a todo app. Be concise and practical. Today is ${today}.

You have access to the user's full task data below. When asked about tasks or done tasks, use this data to answer clearly.

When the user asks to CREATE or ADD a task, respond with a short confirmation AND append a task creation block at the very END of your response in EXACTLY this format (nothing else after it):
[TASK_CREATE]{"title":"Task title here","priority":"medium","type":"work","date":"","description":""}[/TASK_CREATE]

Task creation field rules:
- title: required, clear and concise task title
- priority: "high", "medium", or "low" (default: "medium")
- type: "work", "study", or "activities" (default: "work")
- date: YYYY-MM-DD format, or empty string if no date mentioned
- description: brief description or empty string

User task data:
${pendingCtx}${doneCtx}`;
  }
  if (mode === "summarize") {
    return "You are a summarization assistant. When given text, return 3 to 5 clear bullet points in plain language. Output only the bullet points, no introduction.";
  }
  return "You are a productivity coach. When given a goal, break it into numbered actionable tasks. Label each with a priority: High, Medium, or Low. Be concise.";
}

function parseTaskFromResponse(response: string): {
  cleanText: string;
  taskData: Partial<Task> | null;
} {
  const match = response.match(TASK_CREATE_REGEX);
  if (!match) return { cleanText: response, taskData: null };
  try {
    const taskData = JSON.parse(match[1]);
    const cleanText = response.replace(TASK_CREATE_REGEX, "").trim();
    return { cleanText, taskData };
  } catch {
    return { cleanText: response, taskData: null };
  }
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("chat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load tasks from API when user logs in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);
        try {
          const res = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`);
          const data = await res.json();
          if (data.tasks) {
            setTasks(data.tasks);
          }
        } catch {
          // Fallback to localStorage
          const stored = localStorage.getItem(`tasks_${user.email}`);
          setTasks(stored ? JSON.parse(stored) : []);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setMessages([]);
    setError(null);
    setInput("");
    setDropdownOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const createTask = async (taskData: Partial<Task>): Promise<Task> => {
    if (!userEmail) throw new Error("Not logged in");

    const newTask: Task = {
      id: Date.now(),
      title: taskData.title || "New Task",
      description: taskData.description || undefined,
      priority: taskData.priority || "medium",
      type: taskData.type || "work",
      date: taskData.date || undefined,
      completed: false,
      completedAt: null,
    };

    const updatedTasks = [...tasks, newTask];

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, tasks: updatedTasks }),
    });

    if (!res.ok) throw new Error("Failed to save task");

    setTasks(updatedTasks);
    localStorage.setItem(`tasks_${userEmail}`, JSON.stringify(updatedTasks));
    window.dispatchEvent(new Event("tasksUpdated"));

    return newTask;
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const systemPrompt = buildSystemPrompt(mode, tasks, today);
      const history = [...messages, userMessage];

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);

      const { cleanText, taskData } = parseTaskFromResponse(data.result);

      let createdTask: Task | undefined;
      if (taskData?.title && mode === "chat") {
        try {
          createdTask = await createTask(taskData);
        } catch (err: any) {
          setError(`Task saved in chat but failed to persist: ${err.message}`);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanText, taskCreated: createdTask },
      ]);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentMode = MODES.find((m) => m.id === mode)!;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 font-serif flex flex-col p-4 sm:p-8">

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-full p-4 shadow-md mb-3">
          <Bot size={36} className="text-sky-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">AI Agent</h1>
      </div>

      <div className="w-full flex flex-col gap-4">

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-100 dark:border-gray-700 flex flex-col gap-3 overflow-y-auto hide-scrollbar min-h-[40vh] max-h-[calc(100vh-320px)] p-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center">
              <div className="p-4 rounded-full bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700">
                <currentMode.icon size={28} className="text-sky-400" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">{currentMode.label} mode</p>
              <p className="text-gray-400 text-xs max-w-xs">{currentMode.hint}</p>
              {mode === "chat" && (
                <span className="text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-500 border border-sky-100 dark:border-sky-800 px-3 py-1 rounded-full">
                  {pendingCount} pending · {doneCount} done
                </span>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className={`flex gap-3 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 flex items-center justify-center mt-0.5">
                    <Bot size={14} className="text-sky-500" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === "user"
                    ? "bg-sky-500 text-white rounded-br-sm"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-100 border border-sky-100 dark:border-gray-600 rounded-bl-sm"
                    }`}
                >
                  {msg.content}
                </div>
              </div>

              {/* Task created badge */}
              {msg.taskCreated && (
                <div className="flex items-center gap-2 ml-10 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span>
                    Task created: <strong>{msg.taskCreated.title}</strong>
                  </span>
                  {msg.taskCreated.priority && (
                    <span className="capitalize opacity-70">· {msg.taskCreated.priority}</span>
                  )}
                  {msg.taskCreated.type && (
                    <span className="capitalize opacity-70">· {msg.taskCreated.type}</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 flex items-center justify-center">
                <Bot size={14} className="text-sky-500" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-gray-50 dark:bg-gray-700 border border-sky-100 dark:border-gray-600 flex items-center gap-2 shadow-sm">
                <Loader2 size={14} className="text-sky-400 animate-spin" />
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-500 dark:text-red-400 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-sky-100 dark:border-gray-700 focus-within:border-sky-400 dark:focus-within:border-sky-500 transition-colors p-2 flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            rows={2}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none px-2 py-1 max-h-36 hide-scrollbar"
          />

          {/* Mode dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-sky-200 dark:border-gray-600 bg-sky-50 dark:bg-gray-700 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-gray-600 transition-all text-xs font-semibold"
            >
              <currentMode.icon size={13} className="shrink-0" />
              <span className="hidden sm:inline">{currentMode.label}</span>
              <ChevronUp
                size={12}
                className={`transition-transform duration-150 ${dropdownOpen ? "" : "rotate-180"}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-sky-100 dark:border-gray-700 overflow-hidden z-50">
                {MODES.map(({ id, label, icon: Icon, hint }) => (
                  <button
                    key={id}
                    onClick={() => handleModeChange(id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors
                      ${mode === id
                        ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Icon size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold leading-tight">{label}</p>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow"
          >
            <Send size={16} />
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-400">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
