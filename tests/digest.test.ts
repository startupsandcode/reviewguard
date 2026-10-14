// Weekly digest math on the seed data.
import { describe, expect, it } from "vitest";
import { computeDigest, renderDigestText } from "../lib/digest";
import { useTempDb } from "./setup";
import { loadDb } from "../lib/store";

describe("weekly digest", () => {
  it("computes volume, avg rating trend, reply rate per location", () => {
    useTempDb();
    const db = loadDb();
    const digest = computeDigest(db);

    expect(digest.totalReviews).toBe(7); // all seed reviews are within the last 7 days except older ones
    const main = digest.locations.find((l) => l.locationId === "loc-main-st")!;
    const riverside = digest.locations.find((l) => l.locationId === "loc-riverside")!;
    expect(main.reviewCount + riverside.reviewCount).toBe(digest.totalReviews);

    for (const l of digest.locations) {
      expect(["up", "down", "flat"]).toContain(l.ratingTrend);
      expect(l.replyRate).toBeGreaterThanOrEqual(0);
      expect(l.replyRate).toBeLessThanOrEqual(1);
      // urgent: <=3 stars within the digest week, not yet approved (same window as the digest)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
      const urgent = db.reviews.filter(
        (r) =>
          r.locationId === l.locationId &&
          r.stars <= 3 &&
          r.status !== "approved" &&
          new Date(r.createdAt).getTime() >= weekAgo
      ).length;
      expect(l.needsAttention).toBe(urgent);
    }
  });

  it("digest text renders and the send stub records sent=false", async () => {
    useTempDb();
    const { POST } = await import("../app/api/digest/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const { digest, text, sent, stubbed } = await res.json();
    expect(sent).toBe(false); // stubbed, nothing sent
    expect(stubbed).toBe(true);
    expect(text).toMatch(/ReviewGuard weekly digest/);
    expect(text).toMatch(/reply rate/);
    expect(digest.totalReviews).toBe(7);

    const db = loadDb();
    expect(db.digestLog).toHaveLength(1);
    expect(db.digestLog[0].sent).toBe(false);
  });
});
