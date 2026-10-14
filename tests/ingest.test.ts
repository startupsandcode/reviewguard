// (3) Simulated review ingest -> alert stub -> draft -> approval full flow,
// exercised through the real /api/simulate + approve route handlers.
// Asserts: alert is STUBBED (console.log only, sent=false, no real send),
// draft tier matches star tier, nothing posts to Google.
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useTempDb } from "./setup";
import { resetReplyRateLimitForTests } from "../lib/alerts";
import { loadDb } from "../lib/store";
import { POST as simulatePost } from "../app/api/simulate/route";
import { POST as approvePost } from "../app/api/reviews/[id]/approve/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  useTempDb();
  resetReplyRateLimitForTests();
  process.env.REVIEWGUARD_DEMO = "true";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.REVIEWGUARD_DEMO;
});

function simReq(body: object) {
  return new Request("http://localhost/api/simulate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("simulated ingest full flow", () => {
  it("inject 1-star review -> alert stub logged -> de-escalating draft -> approve", async () => {
    const res = await simulatePost(
      simReq({
        reviewerName: "Test Customer",
        stars: 1,
        comment: "Water all over my floor and no callback for two days.",
        locationId: "loc-main-st",
      })
    );
    expect(res.status).toBe(200);
    const { review, tier, provider, alertStubbed } = await res.json();

    // Ingest
    expect(review.status).toBe("draft");
    expect(review.stars).toBe(1);
    expect(tier).toBe("deescalating");
    expect(provider).toBe("deterministic-template-v1");
    expect(alertStubbed).toBe(true);
    const threadTypes = review.thread.map((t: { type: string }) => t.type);
    expect(threadTypes).toEqual(["received", "draft_generated"]);

    // Alert stub: console.log only, recorded as sent=false
    const logged = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls
      .map((c) => String(c[0]));
    expect(logged.some((l) => l.includes("[ALERT STUB]") && l.includes("Test Customer"))).toBe(true);
    const db = loadDb();
    const alert = db.alertLog.find((a) => a.reviewId === review.id);
    expect(alert).toBeDefined();
    expect(alert!.sent).toBe(false); // nothing was actually sent

    // Draft tone: de-escalating for 1-3 stars, never defensive, no invented facts
    expect(review.draftText).toMatch(/sorry/i);
    expect(review.draftText).not.toMatch(/your fault|not our/i);

    // Approval: records reply, does NOT post to Google
    const a = await approvePost(
      new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" } }),
      ctx(review.id)
    );
    expect(a.status).toBe(200);
    const { review: approved, gbpPosted } = await a.json();
    expect(approved.status).toBe("approved");
    expect(approved.replyText).toBe(review.draftText);
    expect(gbpPosted).toBe(false);
    const logged2 = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls
      .map((c) => String(c[0]));
    expect(logged2.some((l) => l.includes("[GBP STUB]") && l.includes("NOT posted"))).toBe(true);
  });

  it("inject 5-star review -> gracious draft", async () => {
    const res = await simulatePost(
      simReq({ reviewerName: "Happy Homeowner", stars: 5, comment: "Fast, clean, fairly priced. Great crew." })
    );
    expect(res.status).toBe(200);
    const { review, tier } = await res.json();
    expect(tier).toBe("gracious");
    expect(review.draftText).toMatch(/thank you for the 5-star review/i);
    expect(review.draftText).toMatch(/Hi Happy,/); // drafts address by first name
  });

  it("simulate endpoint is 403 without the demo flag", async () => {
    delete process.env.REVIEWGUARD_DEMO;
    const res = await simulatePost(simReq({ stars: 5 }));
    expect(res.status).toBe(403);
  });
});
