import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, model = "openai" } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages are required" }, { status: 400 });
  }

  try {
    // Separate system prompt and chat history
    const systemMsg = messages.find((m: any) => m.role === "system")?.content ?? "";
    const chat = messages.filter((m: any) => m.role !== "system");
    const lastUser = chat[chat.length - 1];

    // Inject prior turns into the system prompt so GET endpoint keeps context
    const history = chat.slice(0, -1);
    const historyText =
      history.length > 0
        ? "\n\nConversation so far:\n" +
          history.map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")
        : "";

    const fullSystem = encodeURIComponent(systemMsg + historyText);
    const prompt = encodeURIComponent(lastUser.content);
    const seed = Math.floor(Math.random() * 9999);

    const url = `https://text.pollinations.ai/${prompt}?model=${model}&seed=${seed}&system=${fullSystem}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Pollinations error: ${response.status}`);
    }

    const result = await response.text();
    return NextResponse.json({ result: result.trim() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to reach AI service" },
      { status: 500 }
    );
  }
}
