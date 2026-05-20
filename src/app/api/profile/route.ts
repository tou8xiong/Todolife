import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/profile
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { data, error } = await supabase
      .from("profiles")
      .select("profile_image, emoji")
      .eq("user_email", email)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is 'Row not found'
      throw error;
    }

    const profile = data
      ? { profileImage: data.profile_image, emoji: data.emoji }
      : { profileImage: null, emoji: null };

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error("[GET /api/profile]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// POST /api/profile  { profileImage?, emoji? }
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { profileImage, emoji } = await req.json();

    const updateData: any = { user_email: email };
    if (profileImage !== undefined) updateData.profile_image = profileImage;
    if (emoji !== undefined) updateData.emoji = emoji;

    const { error } = await supabase
      .from("profiles")
      .upsert(updateData, { onConflict: 'user_email' });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/profile]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
