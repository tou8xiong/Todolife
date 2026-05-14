import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Valid Gemini models — gemini-2.5-flash as primary, gemini-2.0-flash as fallback
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function generateWithGemini(messages: any[], maxRetries = 3): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemMsg = messages.find((m: any) => m.role === "system")?.content ?? "";
        const chat = messages.filter((m: any) => m.role !== "system");
        const history = chat.slice(0, -1);
        const lastUser = chat[chat.length - 1];

        let fullPrompt = systemMsg;
        if (history.length > 0) {
          fullPrompt += "\n\nConversation history:\n";
          history.forEach((m: any) => {
            fullPrompt += `${m.role === "user" ? "User" : "Assistant"}: ${m.content}\n`;
          });
        }
        fullPrompt += `\n\nUser: ${lastUser.content}`;

        const result = await model.generateContent(fullPrompt);
        const text = result.response.text();
        if (text) return text;

      } catch (error: any) {
        const status = error?.status ?? error?.httpErrorCode;
        const msg = error?.message ?? "";

        if (status === 429 || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
          if (attempt < maxRetries - 1) {
            await wait((attempt + 1) * 5000);
            break; // retry whole attempt with next model
          }
          throw new Error("API quota exceeded. Please wait a few minutes and try again.");
        }

        if (status === 503 || msg.includes("503") || msg.includes("overloaded")) {
          await wait(2000);
          continue; // try next model
        }

        // Model not found — try next model silently
        if (status === 404 || msg.includes("not found") || msg.includes("404")) {
          continue;
        }

        throw error;
      }
    }
  }

  throw new Error("All models unavailable. Please try again later.");
}

async function generateWithPythonBackend(messages: any[]): Promise<string> {
  const backendUrl = process.env.PYTHON_BACKEND_URL;
  if (!backendUrl) throw new Error("Python backend URL not configured");

  const res = await fetch(`${backendUrl}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Python backend error: ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages are required" }, { status: 400 });
  }

  try {
    // Use Python backend if configured, otherwise use Gemini directly
    const result = process.env.PYTHON_BACKEND_URL
      ? await generateWithPythonBackend(messages)
      : await generateWithGemini(messages);

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("Agent error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
