import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/ideas?email=user@example.com
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ ideas: [] });

    const data = await redis.get(`ideas:${email}`);
    const ideas = data ? JSON.parse(data as string) : [];
    return NextResponse.json({ ideas });
  } catch (err: any) {
    console.error("[GET /api/ideas]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}

// POST /api/ideas  { email, ideas }
export async function POST(req: NextRequest) {
  try {
    const { email, ideas } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    await redis.set(`ideas:${email}`, JSON.stringify(ideas));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/ideas]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save ideas" }, { status: 500 });
  }
}
