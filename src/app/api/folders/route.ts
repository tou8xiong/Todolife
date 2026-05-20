import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/folders
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ folders: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/folders]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
  }
}

// POST /api/folders  { folder }
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { folder } = await req.json();

    const newFolder = {
      name: typeof folder?.name === "string" && folder.name.trim() ? folder.name.trim() : "New Folder",
      user_email: email,
    };

    const { data, error } = await supabase
      .from("folders")
      .insert(newFolder)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/folders] Supabase error:", error);
      return NextResponse.json({ error: error.message || "Failed to create folder" }, { status: 500 });
    }

    return NextResponse.json({ folder: data });
  } catch (err: any) {
    console.error("[POST /api/folders]", err?.message ?? err);
    return NextResponse.json({ error: err?.message || "Failed to create folder" }, { status: 500 });
  }
}

// DELETE /api/folders?id=uuid
export async function DELETE(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Valid ID required" }, { status: 400 });

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id)
      .eq("user_email", email);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/folders]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

// PATCH /api/folders  { folder }
export async function PATCH(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { folder } = await req.json();
    if (!folder?.id) return NextResponse.json({ error: "Folder id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("folders")
      .update({ name: folder.name.trim() || "New Folder" })
      .eq("id", folder.id)
      .eq("user_email", email)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ folder: data });
  } catch (err: any) {
    console.error("[PATCH /api/folders]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
}
