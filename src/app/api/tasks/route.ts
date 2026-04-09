import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/tasks?email=user@example.com
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ tasks: [] });

    const data = await redis.get(`tasks:${email}`);
    const tasks = data ? JSON.parse(data as string) : [];
    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("[GET /api/tasks]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

// POST /api/tasks  { email, tasks }
export async function POST(req: NextRequest) {
  try {
    const { email, tasks } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await redis.set(`tasks:${email}`, JSON.stringify(tasks));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/tasks]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save tasks" }, { status: 500 });
  }
}
