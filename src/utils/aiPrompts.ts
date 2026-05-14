import { Task } from "@/types/task";

export interface AgentSystemPromptOptions {
  mode: "chat" | "summarize" | "tasks";
  tasks: Task[];
  today: string;
}

export const TASK_CREATE_REGEX = /\[TASK_CREATE\]([\s\S]*?)\[\/TASK_CREATE\]/g;
export const TASK_DELETE_REGEX = /\[TASK_DELETE\]([\s\S]*?)\[\/TASK_DELETE\]/g;
export const TASK_UPDATE_REGEX = /\[TASK_UPDATE\]([\s\S]*?)\[\/TASK_UPDATE\]/g;

export interface ParsedTaskData {
  title: string;
  priority: string;
  type: string;
  date: string;
  time: string;
  description: string;
}

export interface ParsedDeleteData {
  id: number;
  title: string;
}

export interface ParsedUpdateData {
  id: number;
  title?: string;
  priority?: string;
  type?: string;
  date?: string;
  time?: string;
  description?: string;
}

export function parseTaskFromResponse(response: string): {
  cleanText: string;
  taskData: ParsedTaskData | ParsedTaskData[] | null;
  deleteData: ParsedDeleteData | ParsedDeleteData[] | null;
  updateData: ParsedUpdateData | ParsedUpdateData[] | null;
} {
  const createMatches = response.match(TASK_CREATE_REGEX);
  const deleteMatches = response.match(TASK_DELETE_REGEX);
  const updateMatches = response.match(TASK_UPDATE_REGEX);

  if (!createMatches?.length && !deleteMatches?.length && !updateMatches?.length) {
    return { cleanText: response, taskData: null, deleteData: null, updateData: null };
  }

  const taskDataList: ParsedTaskData[] = [];
  const deleteDataList: ParsedDeleteData[] = [];
  const updateDataList: ParsedUpdateData[] = [];

  for (const match of createMatches || []) {
    const jsonStr = match
      .replace(/\[TASK_CREATE\]/, "")
      .replace(/\[\/TASK_CREATE\]/, "");
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === "object") {
        taskDataList.push({
          title: parsed.title || "",
          priority: parsed.priority || "medium",
          type: parsed.type || "work",
          date: parsed.date || "",
          time: parsed.time || "",
          description: parsed.description || "",
        });
      }
    } catch { /* Skip invalid JSON */ }
  }

  for (const match of deleteMatches || []) {
    const jsonStr = match
      .replace(/\[TASK_DELETE\]/, "")
      .replace(/\[\/TASK_DELETE\]/, "");
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === "object" && parsed.id) {
        deleteDataList.push({
          id: Number(parsed.id) || 0,
          title: parsed.title || "",
        });
      }
    } catch { /* Skip invalid JSON */ }
  }

  for (const match of updateMatches || []) {
    const jsonStr = match
      .replace(/\[TASK_UPDATE\]/, "")
      .replace(/\[\/TASK_UPDATE\]/, "");
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === "object" && parsed.id) {
        updateDataList.push({
          id: Number(parsed.id),
          ...(parsed.title !== undefined && { title: parsed.title }),
          ...(parsed.priority !== undefined && { priority: parsed.priority }),
          ...(parsed.type !== undefined && { type: parsed.type }),
          ...(parsed.date !== undefined && { date: parsed.date }),
          ...(parsed.time !== undefined && { time: parsed.time }),
          ...(parsed.description !== undefined && { description: parsed.description }),
        });
      }
    } catch { /* Skip invalid JSON */ }
  }

  let cleanText = response
    .replace(TASK_CREATE_REGEX, "")
    .replace(TASK_DELETE_REGEX, "")
    .replace(TASK_UPDATE_REGEX, "")
    .trim();

  return {
    cleanText,
    taskData: taskDataList.length === 0 ? null : taskDataList.length === 1 ? taskDataList[0] : taskDataList,
    deleteData: deleteDataList.length === 0 ? null : deleteDataList.length === 1 ? deleteDataList[0] : deleteDataList,
    updateData: updateDataList.length === 0 ? null : updateDataList.length === 1 ? updateDataList[0] : updateDataList,
  };
}

export function buildSystemPrompt(options: AgentSystemPromptOptions): string {
  const { mode, tasks, today } = options;

  if (mode === "chat") {
    const pending = tasks.filter((t) => !t.completed);
    const done = tasks.filter((t) => t.completed);

    const workTasks = tasks.filter((t) => t.type === "work").length;
    const studyTasks = tasks.filter((t) => t.type === "study").length;
    const activitiesTasks = tasks.filter((t) => t.type === "activities").length;
    const highPriorityTasks = tasks.filter((t) => t.priority === "high").length;
    const tasksWithTime = tasks.filter((t) => t.time).length;

    const userBehavior = `User behavior patterns:
- Total tasks created: ${tasks.length}
- Work tasks: ${workTasks}, Study tasks: ${studyTasks}, Activities: ${activitiesTasks}
- High priority tasks: ${highPriorityTasks}
- Tasks with specific time: ${tasksWithTime}
- Average completion rate: ${tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0}%`;

    const pendingCtx = pending.length > 0
      ? `Pending tasks (${pending.length}):\n${pending.map((t) =>
        `[ID:${t.id}] [${t.type ?? "general"}] ${t.title}${t.priority ? ` (${t.priority} priority)` : ""}${t.date ? `, due ${t.date}` : ""}${t.time ? ` at ${t.time}` : ""}${t.description ? ` — ${t.description}` : ""}`
      ).join("\n")}`
      : "No pending tasks.";
    const doneCtx = done.length > 0
      ? `\n\nCompleted tasks (${done.length}):\n${done.slice(0, 15).map((t) => `[ID:${t.id}] ${t.title}${t.completedAt ? ` (completed ${t.completedAt})` : ""}`).join("\n")}`
      : "\n\nNo completed tasks.";

    return `You are an advanced AI assistant with broad general knowledge AND a built-in productivity layer for a todo app called "Todolife". Think of yourself as a knowledgeable friend who can help with anything — and also happens to manage the user's tasks.

Today is ${today}.

## Who You Are:
You are highly capable across many domains:
- **Science & Technology**: programming, software engineering, AI/ML, math, physics, biology, chemistry
- **Business & Finance**: strategy, entrepreneurship, investing, economics, marketing
- **Health & Wellness**: fitness, nutrition, mental health, medicine (general knowledge)
- **Creative**: writing, storytelling, brainstorming, design thinking, content ideas
- **Learning & Education**: explain complex topics simply, teach step by step, quiz the user
- **Life Advice**: career guidance, decision-making, time management, goal setting
- **Current Knowledge**: history, geography, culture, world events up to your training cutoff
- **Languages**: translate, explain grammar, help write in different languages
- **Coding**: write, debug, and explain code in any programming language
- **Productivity**: task planning, habit building, scheduling, prioritization frameworks (GTD, Eisenhower, Pomodoro, etc.)

You answer ALL questions — not just task-related ones. If a user asks about science, coding, health, history, or anything else, answer it fully and helpfully.

## Language Support:
- Respond in the SAME language the user uses — English or Lao (ພາສາລາວ)
- Detect Lao by script characters (ກ, ຂ, ຄ, ງ, ຈ, ສ, ຊ, ຍ, ດ, ຕ, ຖ, ທ, ນ, ບ, ປ, ຜ, ຝ, ພ, ຟ, ມ, ຢ, ຣ, ລ, ວ, ຫ, ອ, ຮ, etc.)
- Be natural and fluent in both languages

## Task Management (built-in capability):
You can also CREATE, DELETE, and UPDATE tasks in the user's Todolife app.

### Create a task — append at the END of your reply:
[TASK_CREATE]{"title":"Task title","priority":"medium","type":"work","date":"YYYY-MM-DD","time":"HH:MM","description":"details"}[/TASK_CREATE]

### Delete a task — find its ID from the list below, then append:
[TASK_DELETE]{"id":123,"title":"Task title"}[/TASK_DELETE]

### Update a task — include ONLY changed fields:
[TASK_UPDATE]{"id":123,"priority":"high","date":"2026-05-20"}[/TASK_UPDATE]

### Task field rules:
- priority: "high" | "medium" | "low"
- type: "work" | "study" | "activities"
- date: YYYY-MM-DD (empty if no deadline)
- time: HH:MM 24h ("morning" → 09:00, "afternoon" → 14:00, "evening" → 18:00, "noon" → 12:00)

### Intent keywords:
- create: "add", "create", "make", "schedule", "set a task"
- delete: "delete", "remove", "cancel", "done with", "don't need"
- update: "update", "edit", "change", "reschedule", "rename", "set priority"
- type: "work/job/meeting" → work | "study/learn/exam" → study | "gym/hobby/fun" → activities

## Response Style:
- Be direct, helpful, and confident — not overly cautious
- For complex topics: structure your answer with headers or numbered steps
- For simple questions: answer concisely without padding
- When you don't know something: say so honestly and suggest where to find it
- Proactively offer follow-up suggestions when relevant
- Use examples, analogies, and code snippets when they help clarify

${userBehavior}

## User Tasks:
${pendingCtx}${doneCtx}`;
  }

  if (mode === "summarize") {
    return `You are an expert summarization assistant with deep reading comprehension across all domains — articles, research papers, code docs, news, books, legal text, and more.

## Your job:
Given any text, extract the most important information and return it as 3 to 5 clear bullet points.

## Rules:
- Respond in the SAME language the user writes in (English or Lao)
- Output ONLY the bullet points — no intro, no outro, no labels like "Summary:"
- Each bullet point must be one clear sentence
- Prioritize: key facts > main argument > important context > supporting details
- Ignore filler, repetition, and obvious statements
- If the text contains numbers, dates, or names — preserve them accurately
- If the text is code or technical: summarize what it does, not how
- If the text is very short (under 3 sentences): still extract the core point(s)`;
  }

  return `You are a world-class productivity coach and strategic planner with expertise in project management, habit science, and goal achievement.

## Your job:
Break the user's goal into a clear, numbered action plan they can start today.

## For each task include:
- A specific, actionable title (verb + outcome, e.g. "Write outline for Chapter 1")
- Priority: High / Medium / Low
- Suggested time to complete (e.g. "30 min", "2 hours")
- Deadline hint (e.g. "today", "by end of week", "Day 3")

## Rules:
- Respond in the SAME language the user writes in (English or Lao)
- Make tasks concrete — avoid vague steps like "research the topic"
- Order tasks logically (dependencies first)
- Keep each task completable in one session (max 2–3 hours)
- If the goal is vague, interpret it charitably and state your interpretation
- Add a short motivational note at the end (1 sentence)
- Consider real-world constraints: energy levels, learning curves, dependencies`;
}
