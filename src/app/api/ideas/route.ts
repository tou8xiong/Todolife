import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/ideas
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ideas: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/ideas]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}

// POST /api/ideas  { ideas }
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { ideas } = await req.json();

    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("user_email", email);

    if (deleteError) throw deleteError;

    if (ideas && ideas.length > 0) {
      const rows = ideas.map((n: any) => ({
        id: n.id,
        user_email: email,
        ideatext: n.ideatext,
      }));

      const { error: insertError } = await supabase.from("notes").insert(rows);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/ideas]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save ideas" }, { status: 500 });
  }
}
