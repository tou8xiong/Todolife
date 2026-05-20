import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/tasks
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_email", email);

    if (error) throw error;

    // Map snake_case columns back to camelCase for the frontend
    const tasks = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      time: row.time,
      type: row.type,
      priority: row.priority,
      completed: row.completed,
      completedAt: row.completed_at,
    }));

    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("[GET /api/tasks]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

// POST /api/tasks  { tasks }
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const authResult = await verifyAuth(req);
    if ("error" in authResult) return authResult.error;
    const email = authResult.email;

    const { tasks } = await req.json();

    // Delete all existing tasks for this user, then insert the new set
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("user_email", email);

    if (deleteError) throw deleteError;

    if (tasks && tasks.length > 0) {
      const rows = tasks.map((t: any) => ({
        id: t.id,
        user_email: email,
        title: typeof t.title === "string" && t.title.trim() ? t.title.trim() : "Untitled",
        description: t.description ?? null,
        date: t.date ?? null,
        time: t.time ?? null,
        type: t.type ?? null,
        priority: t.priority ?? null,
        completed: t.completed ?? false,
        completed_at: t.completedAt ?? null,
      }));

      const { error: insertError } = await supabase.from("tasks").insert(rows);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[POST /api/tasks]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to save tasks" }, { status: 500 });
  }
}
