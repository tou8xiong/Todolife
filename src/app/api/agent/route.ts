import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(messages: any[], maxRetries = 3) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const modelName of models) {
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
        const is503 = error?.status === 503 || error?.message?.includes("503");
        const isQuota = error?.status === 429 || error?.message?.includes("quota");

        if (isQuota) {
          if (attempt < maxRetries - 1) {
            const waitTime = (attempt + 1) * 5000;
            console.log(`Quota exceeded, waiting ${waitTime}ms before retry...`);
            await wait(waitTime);
            continue;
          }
          throw new Error("API quota exceeded. Please wait a few minutes and try again.");
        }

        if (is503) {
          console.log(`${modelName} unavailable (503), retrying...`);
          await wait(2000);
          continue;
        }

        throw error;
      }
    }
  }

  throw new Error("All models unavailable. Please try again later.");
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "Messages are required" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const result = await generateWithRetry(messages);
    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("Agent error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
