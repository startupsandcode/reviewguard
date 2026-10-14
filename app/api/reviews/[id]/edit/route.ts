import { NextResponse } from "next/server";
import { getReview, loadDb, saveDb } from "@/lib/store";

// POST /api/reviews/[id]/edit {text} — owner edits the draft before approving
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = loadDb();
  const review = getReview(db, id);
  if (!review) return NextResponse.json({ error: "review not found" }, { status: 404 });
  if (review.status !== "draft") {
    return NextResponse.json({ error: "only a draft can be edited" }, { status: 409 });
  }
  const body = (await req.json()) as { text?: string };
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "empty reply text" }, { status: 400 });

  const at = new Date().toISOString();
  review.draftText = text;
  review.updatedAt = at;
  review.thread.push({ type: "edit", at, by: "owner", text });
  saveDb(db);
  return NextResponse.json({ review });
}
