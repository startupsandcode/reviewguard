import { NextResponse } from "next/server";
import { sendInstantAlert } from "@/lib/alerts";
import { generateReplyDraft } from "@/lib/drafts";
import { addReview, loadDb, saveDb } from "@/lib/store";
import type { Review } from "@/lib/types";

// DEMO ONLY: injects a mock review as if a NEW_REVIEW push event arrived.
// Disabled by default everywhere (403) — production uses real Pub/Sub events.
import { isDemoMode } from "@/lib/demo";

let seq = 0;

export async function POST(req: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "simulate endpoint is disabled in production" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    reviewerName?: string;
    stars?: number;
    comment?: string;
    locationId?: string;
  };

  const db = loadDb();
  const location = db.locations.find((l) => l.id === body.locationId) ?? db.locations[0];
  if (!location) return NextResponse.json({ error: "no locations seeded" }, { status: 500 });

  const stars = [1, 2, 3, 4, 5].includes(Number(body.stars)) ? (Number(body.stars) as 1 | 2 | 3 | 4 | 5) : 5;
  const at = new Date().toISOString();
  seq += 1;
  const review: Review = {
    id: `rev-sim-${Date.now()}-${seq}`,
    locationId: location.id,
    reviewerName: (body.reviewerName || "Demo Customer").trim(),
    stars,
    comment: (body.comment || "").trim() || "Simulated review injected for demo purposes.",
    createdAt: at,
    updatedAt: at,
    status: "pending",
    thread: [{ type: "received", at, by: "system" }],
  };

  // Full loop: ingest -> instant alert (stubbed) -> AI draft (template seam).
  addReview(db, review);
  await sendInstantAlert(db, review, location);

  const { tier, draftText, provider } = await generateReplyDraft(review, location);
  review.draftText = draftText;
  review.status = "draft";
  review.updatedAt = new Date().toISOString();
  review.thread.push({ type: "draft_generated", at: new Date().toISOString(), by: "system", text: draftText });
  saveDb(db);

  return NextResponse.json({ review, tier, provider, alertStubbed: true });
}
