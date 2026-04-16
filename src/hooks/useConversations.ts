import { useState, useEffect, useCallback, useRef } from "react";

export type Mode = "chat" | "summarize" | "tasks";

export interface Message {
  role: "user" | "assistant";
  content: string;
  taskCreated?: { id: number; title: string; priority?: string; type?: string; time?: string };
  taskDeleted?: { id: number; title: string };
}

export interface ConvMeta {
  id: string;
  title: string;
  mode: Mode;
  updatedAt: string;
}

interface UseConversationsOptions {
  email: string | null;
}

export function useConversations({ email }: UseConversationsOptions) {
  const [conversations, setConversations] = useState<ConvMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const conversationsRef = useRef<ConvMeta[]>([]);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const loadConvList = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/agent/history?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch { /* silent */ }
  }, [email]);

  const loadConv = useCallback(async (id: string) => {
    if (!email) return;
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
  }, [email]);

  const saveConv = useCallback(async (
    id: string,
    title: string,
    convMode: Mode,
    msgs: Message[]
  ) => {
    if (!email || !msgs.length) return;
    try {
      await fetch("/api/agent/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, conversation: { id, title, mode: convMode, messages: msgs } }),
      });
      const meta: ConvMeta = { id, title, mode: convMode, updatedAt: new Date().toISOString() };
      setConversations((prev) => [meta, ...prev.filter((c) => c.id !== id)]);
    } catch { /* silent */ }
  }, [email]);

  const deleteConv = useCallback(async (id: string) => {
    if (!email) return;
    try {
      await fetch(`/api/agent/history?email=${encodeURIComponent(email)}&id=${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch { /* silent */ }
  }, [email]);

  const selectConv = useCallback(async (conv: ConvMeta) => {
    setActiveId(conv.id);
    setMessages([]);
    await loadConv(conv.id);
  }, [loadConv]);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    if (email) loadConvList();
  }, [email, loadConvList]);

  return {
    conversations,
    activeId,
    setActiveId,
    messages,
    setMessages,
    historyLoading,
    conversationsRef,
    activeIdRef,
    loadConvList,
    loadConv,
    saveConv,
    deleteConv,
    selectConv,
    startNewChat,
  };
}

export function makeTitle(text: string) {
  return text.length > 45 ? text.slice(0, 45) + "…" : text;
}

export function groupConversations(convs: ConvMeta[]) {
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
    { label: "Today", items: today },
    { label: "Yesterday", items: yesterday },
    { label: "Previous 7 Days", items: older },
  ].filter((g) => g.items.length > 0);
}
