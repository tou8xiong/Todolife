import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/profile?email=user@example.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ profileImage: null, emoji: null });

  const data = await redis.get(`profile:${email}`);
  const profile = data ? JSON.parse(data) : { profileImage: null, emoji: null };
  return NextResponse.json(profile);
}

// POST /api/profile  { email, profileImage?, emoji? }
export async function POST(req: NextRequest) {
  const { email, profileImage, emoji } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Merge with existing so partial updates work
  const existing = await redis.get(`profile:${email}`);
  const current = existing ? JSON.parse(existing) : {};
  const updated = {
    ...current,
    ...(profileImage !== undefined ? { profileImage } : {}),
    ...(emoji !== undefined ? { emoji } : {}),
  };

  await redis.set(`profile:${email}`, JSON.stringify(updated));
  return NextResponse.json({ ok: true });
}
