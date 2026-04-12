import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

const SEVEN_DAYS = 60 * 60 * 24 * 7;
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES = 200;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// GET /api/agent/history?email=              → conversation list
// GET /api/agent/history?email=&id=          → messages for one conversation
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    const id = req.nextUrl.searchParams.get("id");
    if (!email || !isValidEmail(email)) return NextResponse.json({ conversations: [], messages: [] });

    if (id) {
      const data = await redis.get(`agent:${email}:conv:${id}`);
      const messages = data ? JSON.parse(data as string) : [];
      return NextResponse.json({ messages });
    }

    const data = await redis.get(`agent:${email}:convlist`);
    const conversations = data ? JSON.parse(data as string) : [];
    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("[GET /api/agent/history]", err?.message ?? err);
    return NextResponse.json({ conversations: [], messages: [] });
  }
}

// POST /api/agent/history  { email, conversation: { id, title, mode, messages } }
export async function POST(req: NextRequest) {
  try {
    const { email, conversation } = await req.json();
    if (!email || !isValidEmail(email) || !conversation?.id) {
      return NextResponse.json({ error: "Valid email and conversation.id required" }, { status: 400 });
    }

    // Cap messages to prevent unbounded Redis growth
    const limitedMessages = Array.isArray(conversation.messages)
      ? conversation.messages.slice(-MAX_MESSAGES)
      : [];

    await redis.set(
      `agent:${email}:conv:${conversation.id}`,
      JSON.stringify(limitedMessages),
      "EX",
      SEVEN_DAYS
    );

    // Update conversation list (most recent first, capped at MAX_CONVERSATIONS)
    const listData = await redis.get(`agent:${email}:convlist`);
    let list: any[] = listData ? JSON.parse(listData as string) : [];

    const meta = {
      id: conversation.id,
      title: conversation.title,
      mode: conversation.mode,
      updatedAt: new Date().toISOString(),
    };

    list = [meta, ...list.filter((c: any) => c.id !== conversation.id)].slice(0, MAX_CONVERSATIONS);

    await redis.set(
      `agent:${email}:convlist`,
      JSON.stringify(list),
      "EX",
      SEVEN_DAYS
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/agent/history]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save conversation" }, { status: 500 });
  }
}

// DELETE /api/agent/history?email=&id=
export async function DELETE(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    const id = req.nextUrl.searchParams.get("id");
    if (!email || !isValidEmail(email) || !id) {
      return NextResponse.json({ error: "Valid email and id required" }, { status: 400 });
    }

    await redis.del(`agent:${email}:conv:${id}`);

    const listData = await redis.get(`agent:${email}:convlist`);
    if (listData) {
      const list: any[] = JSON.parse(listData as string);
      await redis.set(
        `agent:${email}:convlist`,
        JSON.stringify(list.filter((c: any) => c.id !== id)),
        "EX",
        SEVEN_DAYS
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/agent/history]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
