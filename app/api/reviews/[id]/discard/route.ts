import { NextResponse } from "next/server";
import { getReview, loadDb, saveDb } from "@/lib/store";

// POST /api/reviews/[id]/discard — owner discards the review (no reply sent)
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = loadDb();
  const review = getReview(db, id);
  if (!review) return NextResponse.json({ error: "review not found" }, { status: 404 });
  if (review.status === "approved") return NextResponse.json({ error: "already replied" }, { status: 409 });
  if (review.status === "discarded") return NextResponse.json({ error: "already discarded" }, { status: 409 });

  const at = new Date().toISOString();
  review.status = "discarded";
  review.updatedAt = at;
  review.thread.push({ type: "discarded", at, by: "owner" });
  saveDb(db);
  return NextResponse.json({ review });
}
