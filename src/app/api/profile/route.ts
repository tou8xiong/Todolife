import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/profile?email=user@example.com
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ profileImage: null, emoji: null });

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

// POST /api/profile  { email, profileImage?, emoji? }
export async function POST(req: NextRequest) {
  try {
    const { email, profileImage, emoji } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

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
