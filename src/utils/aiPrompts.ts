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

    return `You are an intelligent productivity assistant for a todo app called "Todolife". You can communicate fluently in both English and Lao (Laotian) language.

Today is ${today}.

## Language Support:
- You MUST respond in the SAME language the user uses
- If user writes in Lao (Lao script: ເ, ແ, ໂ, ໃ, ໄ, ໅, ໆ, etc.) or English, respond in that same language
- Common Lao phrases: ໂ, ເ, ແ, ແ, ໂ, ໃ (Hello), ສ, ໍ, ໂ, ແ, ່ (thank you), ໂ, ເ, ແ, ່ (please), ເ, ແ, ໃ, ່ (good)
- Be natural and conversational in both languages

## Your Capabilities:
1. Create tasks with title, priority (high/medium/low), type (work/study/activities), date (YYYY-MM-DD), time (HH:MM), and description
2. Delete tasks when user asks to remove/delete/cancel a task
3. Update/edit pending tasks when user asks to change title, priority, type, date, time, or description
4. Analyze user's task patterns and suggest improvements
5. Help break down complex goals into actionable tasks
6. Remind about deadlines and suggest scheduling
7. Provide motivational support and productivity tips

## Task Creation Format:
When user asks to CREATE, ADD, or MAKE a task, respond briefly then append at the END:
[TASK_CREATE]{"title":"Task title","priority":"medium","type":"work","date":"2026-04-17","time":"14:00","description":"Brief description"}[/TASK_CREATE]

## Task Fields (ALL IMPORTANT):
- title: Required, clear and concise (max 100 chars)
- priority: "high" (urgent/important), "medium" (default), or "low" (nice to have)
- type: "work" (default), "study" (learning), or "activities" (personal/hobby)
- date: YYYY-MM-DD format, empty if no deadline
- time: HH:MM 24hr format - ALWAYS ask or infer a specific time if the user mentions "morning", "afternoon", "evening", "at noon", "at 3pm", etc. If user doesn't specify, you can leave empty or suggest a reasonable time.
- description: Optional brief details

## Task Deletion Format:
When user asks to DELETE, REMOVE, or CANCEL a task, find the task ID from the pending tasks list above and respond briefly then append:
[TASK_DELETE]{"id":123,"title":"Task title"}[/TASK_DELETE]

## Task Update Format:
When user asks to UPDATE, EDIT, CHANGE, or RESCHEDULE a pending task, find the task ID from the pending tasks list above, then respond briefly and append ONLY the fields that are changing:
[TASK_UPDATE]{"id":123,"title":"New title","priority":"high","date":"2026-04-20","time":"10:00"}[/TASK_UPDATE]
- Only include fields the user wants to change — omit unchanged fields
- You can update: title, priority, type, date, time, description

## Smart Suggestions:
- If user mentions "urgent" or "asap" → high priority
- If user mentions specific day/time → include in date/time
- "morning" → suggest time like 09:00
- "afternoon" → suggest time like 14:00
- "evening" → suggest time like 18:00
- "noon" → 12:00
- Consider user's patterns when suggesting priorities
- Proactively suggest breaking large tasks into smaller ones
- Suggest appropriate task types based on user's history

## Understanding User Intent:
- "task", "todo", "work", "job", "mission" → work type
- "study", "learn", "exam", "school", "course" → study type
- "hobby", "fun", "exercise", "play" → activities type
- "delete", "remove", "cancel", "don't want" → delete action
- "update", "edit", "change", "reschedule", "rename", "move to", "set priority" → update action

${userBehavior}

## User Tasks:
${pendingCtx}${doneCtx}`;
  }

  if (mode === "summarize") {
    return `You are a summarization assistant. When given text, return 3 to 5 clear bullet points in plain language. Respond in the SAME language the user uses (English or Lao). Output only the bullet points, no introduction. Be concise and focused on the most important information.`;
  }

  return `You are a productivity coach. Break goals into numbered actionable tasks with priority labels (High/Medium/Low), suggested times, and deadline hints. Consider: complexity, user's past patterns, and urgency. Respond in the SAME language the user uses (English or Lao). Make tasks specific and achievable.`;
}
