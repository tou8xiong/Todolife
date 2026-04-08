import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

// GET /api/ideas?email=user@example.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ ideas: [] });

  const data = await redis.get(`ideas:${email}`);
  const ideas = data ? JSON.parse(data) : [];
  return NextResponse.json({ ideas });
}

// POST /api/ideas  { email, ideas }
export async function POST(req: NextRequest) {
  const { email, ideas } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  await redis.set(`ideas:${email}`, JSON.stringify(ideas));
  return NextResponse.json({ ok: true });
}
