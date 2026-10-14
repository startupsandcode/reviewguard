import { NextResponse } from "next/server";
import { checkReplyRateLimit, postReplyToGbp } from "@/lib/alerts";
import { getReview, loadDb, saveDb } from "@/lib/store";

// POST /api/reviews/[id]/approve {text?} — owner approves (or approves with
// the text from /edit). Demo mode is APPROVAL-ONLY: nothing ever posts to
// Google. Reply bursts are paced (10 approvals/min per location).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = loadDb();
  const review = getReview(db, id);
  if (!review) return NextResponse.json({ error: "review not found" }, { status: 404 });
  if (review.status === "approved") return NextResponse.json({ error: "already replied" }, { status: 409 });
  if (review.status === "discarded") return NextResponse.json({ error: "review discarded" }, { status: 409 });
  if (review.status === "pending" || !review.draftText) {
    return NextResponse.json({ error: "generate a draft first" }, { status: 409 });
  }

  const rate = checkReplyRateLimit(review.locationId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `reply burst paced: max 10 approvals/min per location; retry in ~${rate.retryAfterSec}s` },
      { status: 429 }
    );
  }

  let text: string | undefined;
  try {
    const body = (await req.json()) as { text?: string };
    text = body.text;
  } catch {
    /* no body: approve draft as-is */
  }
  const replyText = (text ?? review.draftText ?? "").trim();
  if (!replyText) return NextResponse.json({ error: "empty reply text" }, { status: 400 });

  const gbp = await postReplyToGbp(review, replyText); // stubbed: nothing posted
  const at = new Date().toISOString();
  review.replyText = replyText;
  review.status = "approved";
  review.updatedAt = at;
  review.thread.push({ type: "approved", at, by: "owner", text: replyText });
  saveDb(db);
  return NextResponse.json({ review, gbpPosted: gbp.posted });
}
