import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// GET /api/ideas?email=user@example.com
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email || !isValidEmail(email)) return NextResponse.json({ ideas: [] });

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

// POST /api/ideas  { email, ideas }
export async function POST(req: NextRequest) {
  try {
    const { email, ideas } = await req.json();
    if (!email || !isValidEmail(email)) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

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
