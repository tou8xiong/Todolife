import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

// GET /api/tasks?email=user@example.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ tasks: [] });

  const data = await redis.get(`tasks:${email}`);
  const tasks = data ? JSON.parse(data) : [];
  return NextResponse.json({ tasks });
}

// POST /api/tasks  { email, tasks }
export async function POST(req: NextRequest) {
  const { email, tasks } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  await redis.set(`tasks:${email}`, JSON.stringify(tasks));
  return NextResponse.json({ ok: true });
}
