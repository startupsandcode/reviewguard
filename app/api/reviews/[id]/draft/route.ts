import { NextResponse } from "next/server";
import { generateReplyDraft } from "@/lib/drafts";
import { getReview, loadDb, saveDb } from "@/lib/store";

// POST /api/reviews/[id]/draft — generate (idempotent) AI draft reply
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = loadDb();
  const review = getReview(db, id);
  if (!review) return NextResponse.json({ error: "review not found" }, { status: 404 });
  if (review.status === "approved") return NextResponse.json({ error: "already replied" }, { status: 409 });
  if (review.status === "discarded") return NextResponse.json({ error: "review discarded" }, { status: 409 });

  const location = db.locations.find((l) => l.id === review.locationId);
  if (!location) return NextResponse.json({ error: "location not found" }, { status: 404 });

  if (review.status === "draft" && review.draftText) {
    return NextResponse.json({ review, idempotent: true });
  }

  const { tier, draftText, provider } = await generateReplyDraft(review, location);
  review.draftText = draftText;
  review.status = "draft";
  review.updatedAt = new Date().toISOString();
  review.thread.push({ type: "draft_generated", at: new Date().toISOString(), by: "system", text: draftText });
  saveDb(db);
  return NextResponse.json({ review, tier, provider });
}
