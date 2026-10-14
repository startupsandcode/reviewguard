// Weekly digest: review volume, average rating trend, reply rate (per location + all).
// Email delivery is STUBBED in demo mode (console.log only, sent=false).

import type { Db, Location, Review } from "./types";

export interface LocationDigest {
  locationId: string;
  locationName: string;
  reviewCount: number;
  avgRating: number | null;
  avgRatingPrevWeek: number | null;
  ratingTrend: "up" | "down" | "flat";
  replyRate: number; // 0..1 over replied-eligible reviews (approved = replied in demo)
  needsAttention: number; // <=3 stars not yet replied
}

export interface Digest {
  period: { from: string; to: string };
  locations: LocationDigest[];
  totalReviews: number;
  overallReplyRate: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function avg(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
}

export function computeDigest(db: Db, now = new Date()): Digest {
  const to = now;
  const from = new Date(now.getTime() - WEEK_MS);
  const prevFrom = new Date(from.getTime() - WEEK_MS);

  const inWindow = (r: Review, a: Date, b: Date) => {
    const t = new Date(r.createdAt).getTime();
    return t >= a.getTime() && t < b.getTime();
  };

  const locations: LocationDigest[] = db.locations.map((loc: Location) => {
    const cur = db.reviews.filter((r) => r.locationId === loc.id && inWindow(r, from, to));
    const prev = db.reviews.filter((r) => r.locationId === loc.id && inWindow(r, prevFrom, from));
    const a = avg(cur);
    const ap = avg(prev);
    const replied = cur.filter((r) => r.status === "approved").length;
    return {
      locationId: loc.id,
      locationName: loc.name,
      reviewCount: cur.length,
      avgRating: a,
      avgRatingPrevWeek: ap,
      ratingTrend: a == null || ap == null ? "flat" : a > ap ? "up" : a < ap ? "down" : "flat",
      replyRate: cur.length === 0 ? 1 : replied / cur.length,
      needsAttention: cur.filter((r) => r.stars <= 3 && r.status !== "approved").length,
    };
  });

  const allCur = db.reviews.filter((r) => inWindow(r, from, to));
  const repliedAll = allCur.filter((r) => r.status === "approved").length;

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    locations,
    totalReviews: allCur.length,
    overallReplyRate: allCur.length === 0 ? 1 : repliedAll / allCur.length,
  };
}

export function renderDigestText(digest: Digest): string {
  const lines = [
    "ReviewGuard weekly digest",
    `Period: ${digest.period.from.slice(0, 10)} -> ${digest.period.to.slice(0, 10)}`,
    `Total reviews: ${digest.totalReviews}`,
    `Overall reply rate: ${(digest.overallReplyRate * 100).toFixed(0)}%`,
    "",
  ];
  for (const l of digest.locations) {
    lines.push(
      `${l.locationName}: ${l.reviewCount} reviews, avg ${l.avgRating == null ? "n/a" : l.avgRating.toFixed(1)} ` +
        `(trend ${l.ratingTrend}), reply rate ${(l.replyRate * 100).toFixed(0)}%, ` +
        `${l.needsAttention} <=3-star needing reply`
    );
  }
  return lines.join("\n");
}

export async function sendDigestEmailStub(digest: Digest): Promise<{ sent: boolean; stubbed: boolean }> {
  // DEMO: stubbed; production sends via Resend.
  // eslint-disable-next-line no-console
  console.log("[DIGEST STUB] weekly digest email NOT sent (demo mode):\n" + renderDigestText(digest));
  return { sent: false, stubbed: true };
}
