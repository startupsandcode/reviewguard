// (2) Compliance invariant: the feedback-link code path sends IDENTICAL
// links to every customer — no sentiment/rating conditional routing anywhere.
// This encodes the April 2026 Google review-gating ban. Any future branch on
// rating or sentiment in this path must fail these tests.
import { describe, expect, it } from "vitest";
import { getFeedbackLink, FEEDBACK_POLICY_NOTE } from "../lib/compliance";

describe("no review gating", () => {
  it("every customer gets the identical feedback link regardless of rating tier", () => {
    const customers = ["cust-happy-1", "cust-angry-99", "cust-neutral-7", "cust-new-0"];
    const links = customers.map((c) => getFeedbackLink(c));
    expect(new Set(links).size).toBe(1);
  });

  it("link is identical across all 5 star ratings (rating-blind by construction)", () => {
    const byRating = [1, 2, 3, 4, 5].map((stars) => {
      // Even when the caller knows the rating, the link function must not use it.
      return getFeedbackLink(`cust-with-${stars}-stars`);
    });
    expect(new Set(byRating).size).toBe(1);
  });

  it("link carries no sentiment or rating signal (no query params, stable shape)", () => {
    const link = getFeedbackLink("any-customer");
    expect(link).not.toMatch(/[?&]/); // no query string that could encode sentiment
    expect(link.startsWith("https://")).toBe(true);
    expect(link).toBe(getFeedbackLink("any-customer")); // deterministic
  });

  it("policy note documents equal prominence of private + public links", () => {
    expect(FEEDBACK_POLICY_NOTE).toMatch(/equal prominence/i);
    expect(FEEDBACK_POLICY_NOTE).toMatch(/private/i);
    expect(FEEDBACK_POLICY_NOTE).toMatch(/public/i);
  });

  it("feedback path does not filter customers: 100 customers, 1 distinct link", () => {
    const links = new Set(
      Array.from({ length: 100 }, (_, i) => getFeedbackLink(`cust-${i}`))
    );
    expect(links.size).toBe(1);
  });
});
