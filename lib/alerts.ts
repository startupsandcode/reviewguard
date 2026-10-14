// Alerting + GBP reply posting: STUBBED in demo mode.
// DEMO: alerts are logged to console and recorded in db.alertLog with
// sent=false. ZERO emails/SMS are sent. GBP reply POSTs are logged only.
// PRODUCTION: wire sendInstantAlert() to Resend (instant for <=3 stars,
// digest option for 4-5), and postReplyToGbp() to
// PUT /v4/accounts/{a}/locations/{l}/reviews/{reviewId}/reply.

import type { Db, Location, Review } from "./types";

export async function sendInstantAlert(
  db: Db,
  review: Review,
  location: Location
): Promise<{ sent: boolean; stubbed: boolean }> {
  const line =
    `[ALERT STUB] ${review.stars}-star review from ${review.reviewerName} ` +
    `at ${location.name}: "${review.comment.slice(0, 80)}${review.comment.length > 80 ? "..." : ""}" ` +
    `(email via Resend STUBBED in demo mode; nothing sent)`;
  // eslint-disable-next-line no-console
  console.log(line);

  db.alertLog.push({
    at: new Date().toISOString(),
    reviewId: review.id,
    locationId: review.locationId,
    stars: review.stars,
    reviewerName: review.reviewerName,
    sent: false,
  });
  return { sent: false, stubbed: true };
}

export async function postReplyToGbp(
  review: Review,
  replyText: string
): Promise<{ posted: boolean; stubbed: boolean }> {
  // DEMO: do not touch Google. In production this is the GBP v4 reply call.
  // eslint-disable-next-line no-console
  console.log(
    `[GBP STUB] PUT .../reviews/${review.id}/reply (${replyText.length} chars) ` +
      `— NOT posted (demo mode; no Google credentials configured)`
  );
  return { posted: false, stubbed: true };
}

// Reply-burst pacing. Google documents a 10-edits-per-minute-per-location cap
// for location edits; review replies are writes against the same program, so
// keep reply bursts paced. In-memory for demo; production: enforce in the
// worker with a distributed counter.
const approveWindow: Map<string, number[]> = new Map();
export const REPLY_RATE_LIMIT_PER_MIN = 10;

export function checkReplyRateLimit(locationId: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const window = (approveWindow.get(locationId) ?? []).filter((t) => now - t < 60_000);
  if (window.length >= REPLY_RATE_LIMIT_PER_MIN) {
    return { allowed: false, retryAfterSec: 60 };
  }
  window.push(now);
  approveWindow.set(locationId, window);
  return { allowed: true };
}

export function resetReplyRateLimitForTests(): void {
  approveWindow.clear();
}
