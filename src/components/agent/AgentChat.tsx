"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Task } from "@/types/task";
import {
  Bot, Send, Loader2, MessageSquare, FileText, ListTodo,
  AlertCircle, ChevronUp, CheckCircle2, SquarePen, Trash2, Menu, X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Mode = "chat" | "summarize" | "tasks";

interface Message {
  role: "user" | "assistant";
  content: string;
  taskCreated?: Task;
}

interface ConvMeta {
  id: string;
  title: string;
  mode: Mode;
  updatedAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TASK_CREATE_REGEX = /\[TASK_CREATE\]([\s\S]*?)\[\/TASK_CREATE\]/;

const MODES: { id: Mode; label: string; icon: React.ElementType; placeholder: string; hint: string }[] = [
  { id: "chat",      label: "Chat",          icon: MessageSquare, placeholder: "Ask about tasks, or say 'create a task: buy groceries'...", hint: "I can read your tasks, show done tasks, and create new ones." },
  { id: "summarize", label: "Summarize",     icon: FileText,      placeholder: "Paste any text here and I'll summarize it...",              hint: "I'll return 3–5 concise bullet points." },
  { id: "tasks",     label: "Suggest Tasks", icon: ListTodo,      placeholder: "Describe your goal (e.g. 'finish my project this week')...", hint: "I'll break it into actionable tasks with priorities." },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTitle(text: string) {
  return text.length > 45 ? text.slice(0, 45) + "…" : text;
}

function groupConversations(convs: ConvMeta[]) {
  const now = Date.now();
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const startOfYesterday = startOfToday - 86400000;

  const today: ConvMeta[] = [];
  const yesterday: ConvMeta[] = [];
  const older: ConvMeta[] = [];

  convs.forEach((c) => {
    const t = new Date(c.updatedAt).getTime();
    if (t >= startOfToday) today.push(c);
    else if (t >= startOfYesterday) yesterday.push(c);
    else older.push(c);
  });

  return [
    { label: "Today",            items: today },
    { label: "Yesterday",        items: yesterday },
    { label: "Previous 7 Days",  items: older },
  ].filter((g) => g.items.length > 0);
}

function buildSystemPrompt(mode: Mode, tasks: Task[], today: string): string {
  if (mode === "chat") {
    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);
    const pendingCtx = pending.length > 0
      ? `Pending tasks (${pending.length}):\n${pending.map((t, i) => `${i + 1}. [${t.type ?? "general"}] ${t.title}${t.priority ? ` (${t.priority} priority)` : ""}${t.date ? `, due ${t.date}` : ""}${t.description ? ` — ${t.description}` : ""}`).join("\n")}`
      : "No pending tasks.";
    const doneCtx = done.length > 0
      ? `\n\nCompleted tasks (${done.length}):\n${done.slice(0, 15).map((t, i) => `${i + 1}. ${t.title}${t.completedAt ? ` (completed ${t.completedAt})` : ""}`).join("\n")}`
      : "\n\nNo completed tasks.";
    return `You are a helpful productivity assistant for a todo app. Be concise and practical. Today is ${today}.\n\nYou have access to the user's full task data below. When asked about tasks or done tasks, use this data to answer clearly.\n\nWhen the user asks to CREATE or ADD a task, respond with a short confirmation AND append a task creation block at the very END of your response in EXACTLY this format (nothing else after it):\n[TASK_CREATE]{"title":"Task title here","priority":"medium","type":"work","date":"","description":""}[/TASK_CREATE]\n\nTask creation field rules:\n- title: required, clear and concise task title\n- priority: "high", "medium", or "low" (default: "medium")\n- type: "work", "study", or "activities" (default: "work")\n- date: YYYY-MM-DD format, or empty string if no date mentioned\n- description: brief description or empty string\n\nUser task data:\n${pendingCtx}${doneCtx}`;
  }
  if (mode === "summarize") {
    return "You are a summarization assistant. When given text, return 3 to 5 clear bullet points in plain language. Output only the bullet points, no introduction.";
  }
  return "You are a productivity coach. When given a goal, break it into numbered actionable tasks. Label each with a priority: High, Medium, or Low. Be concise.";
}

function parseTaskFromResponse(response: string) {
  const match = response.match(TASK_CREATE_REGEX);
  if (!match) return { cleanText: response, taskData: null };
  try {
    return { cleanText: response.replace(TASK_CREATE_REGEX, "").trim(), taskData: JSON.parse(match[1]) };
  } catch {
    return { cleanText: response, taskData: null };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentChat() {
  const [conversations, setConversations] = useState<ConvMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<Mode>("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const modeRef = useRef<Mode>("chat");
  const conversationsRef = useRef<ConvMeta[]>([]);

  // Keep refs in sync for visibility handler
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // ── API helpers ────────────────────────────────────────────────────────────

  const loadConvList = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/agent/history?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch { /* silent */ }
  }, []);

  const loadConv = useCallback(async (email: string, id: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/agent/history?email=${encodeURIComponent(email)}&id=${id}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const saveConv = useCallback(async (
    email: string,
    id: string,
    title: string,
    convMode: Mode,
    msgs: Message[]
  ) => {
    if (!msgs.length) return;
    try {
      await fetch("/api/agent/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, conversation: { id, title, mode: convMode, messages: msgs } }),
      });
      // Update local list
      const meta: ConvMeta = { id, title, mode: convMode, updatedAt: new Date().toISOString() };
      setConversations((prev) => [meta, ...prev.filter((c) => c.id !== id)]);
    } catch { /* silent */ }
  }, []);

  const deleteConv = useCallback(async (email: string, id: string) => {
    try {
      await fetch(`/api/agent/history?email=${encodeURIComponent(email)}&id=${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch { /* silent */ }
  }, []);

  // ── Auth + initial load ────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);
        try {
          const res = await fetch(`/api/tasks?email=${encodeURIComponent(user.email)}`);
          const data = await res.json();
          if (data.tasks) setTasks(data.tasks);
        } catch {
          const stored = localStorage.getItem(`tasks_${user.email}`);
          setTasks(stored ? JSON.parse(stored) : []);
        }
        await loadConvList(user.email);
      }
    });
    return () => unsub();
  }, [loadConvList]);

  // ── Save on page hide ─────────────────────────────────────────────────────

  useEffect(() => {
    const onHide = () => {
      if (
        document.visibilityState === "hidden" &&
        userEmail &&
        activeIdRef.current &&
        messagesRef.current.length > 0
      ) {
        const conv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
        const title = conv?.title ?? makeTitle(messagesRef.current[0]?.content ?? "Conversation");
        saveConv(userEmail, activeIdRef.current, title, modeRef.current, messagesRef.current);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [userEmail, saveConv]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Close dropdown on outside click ──────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setMode("chat");
    setError(null);
    setInput("");
    setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const selectConv = async (conv: ConvMeta) => {
    if (!userEmail) return;
    setActiveId(conv.id);
    setMode(conv.mode);
    setError(null);
    setInput("");
    setSidebarOpen(false);
    await loadConv(userEmail, conv.id);
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

    // Create conversation ID on first message
    const convId = activeId ?? String(Date.now());
    const isNew = !activeId;
    if (isNew) setActiveId(convId);

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: buildSystemPrompt(mode, tasks, today) },
            ...updatedWithUser.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);

      const { cleanText, taskData } = parseTaskFromResponse(data.result);

      let createdTask: Task | undefined;
      if (taskData?.title && mode === "chat") {
        try { createdTask = await createTask(taskData); }
        catch (err: any) { setError(`Task created in chat but failed to persist: ${err.message}`); }
      }

      const assistantMessage: Message = { role: "assistant", content: cleanText, taskCreated: createdTask };
      const finalMessages = [...updatedWithUser, assistantMessage];
      setMessages(finalMessages);

      // Save to Redis — title = first user message
      if (userEmail) {
        const title = isNew
          ? makeTitle(trimmed)
          : (conversations.find((c) => c.id === convId)?.title ?? makeTitle(trimmed));
        saveConv(userEmail, convId, title, mode, finalMessages);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const currentMode = MODES.find((m) => m.id === mode)!;
  const groups = groupConversations(conversations);
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 dark:bg-gray-900 font-serif">

      {/* ── Sidebar backdrop (mobile) ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed top-16 inset-x-0 bottom-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 md:static md:top-auto md:bottom-auto
        w-64 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* New Chat button */}
        <div className="p-3 border-b border-gray-700/60">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white text-sm transition-all"
          >
            <SquarePen size={15} className="shrink-0 text-sky-400" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-600 text-center mt-8 px-3 leading-relaxed">
              No conversations yet.<br />Start a new chat!
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-1">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map((conv) => (
                    <li key={conv.id} className="group relative">
                      <button
                        onClick={() => selectConv(conv)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all pr-8 leading-snug
                          ${activeId === conv.id
                            ? "bg-gray-700 text-white"
                            : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                          }`}
                      >
                        <span className="block truncate">{conv.title}</span>
                        <span className={`text-[10px] mt-0.5 block opacity-50 ${activeId === conv.id ? "text-sky-400" : ""}`}>
                          {conv.mode}
                        </span>
                      </button>
                      {/* Delete on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (userEmail) deleteConv(userEmail, conv.id); }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-700/60">
          <p className="text-[10px] text-gray-700 text-center tracking-widest uppercase">Chats kept 7 days</p>
        </div>
      </aside>

      {/* ── Main chat area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 shrink-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <Bot size={18} className="text-sky-400 shrink-0" />
            <span className="font-semibold text-gray-800 dark:text-white text-sm">
              {activeId
                ? (conversations.find((c) => c.id === activeId)?.title ?? "Conversation")
                : "AI Agent"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">

          {historyLoading && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-xs">
              <Loader2 size={14} className="animate-spin" />
              Loading conversation...
            </div>
          )}

          {!historyLoading && !activeId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4 text-center">
              <div className="p-5 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700">
                <Bot size={36} className="text-sky-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">How can I help you?</h2>
              {mode === "chat" && (
                <span className="text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-500 border border-sky-100 dark:border-sky-800 px-3 py-1 rounded-full">
                  {pendingCount} pending · {doneCount} done
                </span>
              )}
              <p className="text-sm text-gray-400 max-w-sm">{currentMode.hint}</p>
            </div>
          )}

          {!historyLoading && messages.map((msg, i) => (
            <div key={i} className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 flex items-center justify-center mt-0.5">
                    <Bot size={14} className="text-sky-500" />
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                  ${msg.role === "user"
                    ? "bg-sky-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm"
                  }`}>
                  {msg.content}
                </div>
              </div>

              {msg.taskCreated && (
                <div className="flex items-center gap-2 ml-10 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs">
                  <CheckCircle2 size={13} className="shrink-0" />
                  Task created: <strong>{msg.taskCreated.title}</strong>
                  {msg.taskCreated.priority && <span className="capitalize opacity-70">· {msg.taskCreated.priority}</span>}
                  {msg.taskCreated.type && <span className="capitalize opacity-70">· {msg.taskCreated.type}</span>}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700 flex items-center justify-center">
                <Bot size={14} className="text-sky-500" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center gap-2 shadow-sm">
                <Loader2 size={14} className="text-sky-400 animate-spin" />
                <span className="text-xs text-gray-400">Thinking…</span>
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

        {/* Input area */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 focus-within:border-sky-400 dark:focus-within:border-sky-500 transition-colors p-2 flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentMode.placeholder}
              rows={2}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none px-2 py-1 max-h-36"
            />

            {/* Mode dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-sky-200 dark:border-gray-600 bg-sky-50 dark:bg-gray-700 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-gray-600 transition-all text-xs font-semibold"
              >
                <currentMode.icon size={13} className="shrink-0" />
                <span className="hidden sm:inline">{currentMode.label}</span>
                <ChevronUp size={12} className={`transition-transform duration-150 ${dropdownOpen ? "" : "rotate-180"}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  {MODES.map(({ id, label, icon: Icon, hint }) => (
                    <button
                      key={id}
                      onClick={() => { setMode(id); setDropdownOpen(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors
                        ${mode === id ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
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
          <p className="text-center text-[10px] text-gray-400 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
