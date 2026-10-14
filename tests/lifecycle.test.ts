// (1) Approve / edit / discard reply lifecycle, exercised through the real
// API route handlers against an isolated temp store.
import { describe, expect, it, beforeEach } from "vitest";
import { useTempDb } from "./setup";
import { resetReplyRateLimitForTests } from "../lib/alerts";
import { loadDb } from "../lib/store";
import { POST as draftPost } from "../app/api/reviews/[id]/draft/route";
import { POST as approvePost } from "../app/api/reviews/[id]/approve/route";
import { POST as editPost } from "../app/api/reviews/[id]/edit/route";
import { POST as discardPost } from "../app/api/reviews/[id]/discard/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const jsonReq = (body?: object) =>
  new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeEach(() => {
  useTempDb();
  resetReplyRateLimitForTests();
});

describe("reply lifecycle", () => {
  it("pending -> draft -> edited -> approved, with timestamped thread entries", async () => {
    // rev-1f6 is seeded as "pending" (1 star, no draft)
    const d = await draftPost(jsonReq(), ctx("rev-1f6"));
    expect(d.status).toBe(200);
    let review = (await d.json()).review;
    expect(review.status).toBe("draft");
    expect(review.draftText).toContain("Hi Anonymous");
    // de-escalating tier for 1 star: never defensive, no invented facts
    expect(review.draftText).not.toMatch(/defensive|your fault/i);

    const editedText = "Hi Anonymous, this is the owner. We are truly sorry we missed your window. Please call us directly so we can reschedule at your convenience.";
    const e = await editPost(jsonReq({ text: editedText }), ctx("rev-1f6"));
    expect(e.status).toBe(200);
    review = (await e.json()).review;
    expect(review.status).toBe("draft");
    expect(review.draftText).toBe(editedText);

    const a = await approvePost(jsonReq(), ctx("rev-1f6"));
    expect(a.status).toBe(200);
    const { review: approved, gbpPosted } = await a.json();
    expect(approved.status).toBe("approved");
    expect(approved.replyText).toBe(editedText);
    expect(gbpPosted).toBe(false); // demo: nothing posts to Google

    const types = approved.thread.map((t: { type: string }) => t.type);
    expect(types).toEqual(["received", "draft_generated", "edit", "approved"]);
    for (const entry of approved.thread) {
      expect(new Date(entry.at).getTime()).not.toBeNaN();
    }
  });

  it("approve without a draft is rejected (approval-only guard)", async () => {
    // rev-1f6 pending -> skip draft, go straight to approve
    const a = await approvePost(jsonReq(), ctx("rev-1f6"));
    expect(a.status).toBe(409);
    expect((await a.json()).error).toMatch(/draft first/);
  });

  it("discard path: draft -> discarded, and nothing can be approved afterwards", async () => {
    // rev-3d4 is seeded with a draft
    const disc = await discardPost(jsonReq(), ctx("rev-3d4"));
    expect(disc.status).toBe(200);
    expect((await disc.json()).review.status).toBe("discarded");

    const a = await approvePost(jsonReq(), ctx("rev-3d4"));
    expect(a.status).toBe(409);

    const e = await editPost(jsonReq({ text: "x" }), ctx("rev-3d4"));
    expect(e.status).toBe(409);
  });

  it("double-approve and double-discard are rejected", async () => {
    // rev-5a1 is already approved in seed
    const a = await approvePost(jsonReq(), ctx("rev-5a1"));
    expect(a.status).toBe(409);

    await discardPost(jsonReq(), ctx("rev-3d4"));
    const second = await discardPost(jsonReq(), ctx("rev-3d4"));
    expect(second.status).toBe(409);
  });

  it("draft generation is idempotent (same draft returned, no duplicate thread entry)", async () => {
    // rev-5c3 already has a draft in seed
    const before = loadDb().reviews.find((r) => r.id === "rev-5c3")!;
    const d = await draftPost(jsonReq(), ctx("rev-5c3"));
    expect(d.status).toBe(200);
    const { review, idempotent } = await d.json();
    expect(idempotent).toBe(true);
    expect(review.draftText).toBe(before.draftText);
    expect(review.thread.length).toBe(before.thread.length);
  });

  it("empty edit text is rejected", async () => {
    const e = await editPost(jsonReq({ text: "   " }), ctx("rev-5c3"));
    expect(e.status).toBe(400);
  });

  it("unknown review id returns 404", async () => {
    const d = await draftPost(jsonReq(), ctx("rev-nope"));
    expect(d.status).toBe(404);
  });

  it("reply bursts are paced: 11th approval in a minute returns 429", async () => {
    // approve rev-1f6 first, then re-seed 10 more drafts via simulate-like reviews
    await draftPost(jsonReq(), ctx("rev-1f6"));
    await approvePost(jsonReq(), ctx("rev-1f6")); // 1st approval for loc-main-st

    const db = loadDb();
    for (let i = 0; i < 9; i++) {
      db.reviews.push({
        id: `rev-burst-${i}`,
        locationId: "loc-main-st",
        reviewerName: "Burst Tester",
        stars: 5,
        comment: "Burst test review.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
        draftText: "Thanks!",
        thread: [],
      });
    }
    const { saveDb } = await import("../lib/store");
    saveDb(db);

    let lastStatus = 0;
    for (let i = 0; i < 9; i++) {
      const r = await approvePost(jsonReq(), ctx(`rev-burst-${i}`));
      lastStatus = r.status;
    }
    expect(lastStatus).toBe(200); // 10th approval OK

    // 11th: exceed the 10/min per-location cap
    const db3 = loadDb();
    db3.reviews.push({
      id: "rev-burst-11",
      locationId: "loc-main-st",
      reviewerName: "Burst Tester",
      stars: 5,
      comment: "Burst test review 11.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft",
      draftText: "Thanks!",
      thread: [],
    });
    saveDb(db3);
    const over = await approvePost(jsonReq(), ctx("rev-burst-11"));
    expect(over.status).toBe(429);
    expect((await over.json()).error).toMatch(/paced/);
  });
});
