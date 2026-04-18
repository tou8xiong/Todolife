import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// GET /api/documents?email=user@example.com&id=optional_id
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    const id = req.nextUrl.searchParams.get("id");
    if (!email || !isValidEmail(email)) return NextResponse.json({ documents: [] });

    let query = supabase
      .from("documents")
      .select(id ? "*" : "id, title, folder_id, updated_at, user_email")
      .eq("user_email", email);

    if (id) {
      query = query.eq("id", Number(id));
      const { data, error } = await query.single();
      if (error) throw error;
      return NextResponse.json({ document: data });
    } else {
      query = query.order("updated_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ documents: data ?? [] });
    }
  } catch (err: any) {
    console.error("[GET /api/documents]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

// POST /api/documents  { email, document }
export async function POST(req: NextRequest) {
  try {
    const { email, document: doc } = await req.json();
    if (!email || !isValidEmail(email)) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    if (!doc?.id) return NextResponse.json({ error: "Document id required" }, { status: 400 });

    const { error } = await supabase.from("documents").upsert({
      id: doc.id,
      user_email: email,
      title: typeof doc.title === "string" && doc.title.trim() ? doc.title.trim() : "Untitled Document",
      content: typeof doc.content === "string" ? doc.content : "",
      folder_id: doc.folder_id || null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/documents]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }
}

// DELETE /api/documents?id=123&email=user@example.com
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const email = req.nextUrl.searchParams.get("email");
    if (!id || !email || !isValidEmail(email)) return NextResponse.json({ error: "Valid ID and email required" }, { status: 400 });

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", Number(id))
      .eq("user_email", email);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/documents]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
