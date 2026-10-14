import { NextResponse } from "next/server";
import { loadDb, reviewsForLocation } from "@/lib/store";
import type { Location } from "@/lib/types";

// GET /api/reviews?locationId=... — review inbox + per-location stats
export async function GET(req: Request) {
  const db = loadDb();
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");

  const stats = db.locations.map((loc: Location) => {
    const reviews = reviewsForLocation(db, loc.id);
    const replied = reviews.filter((r) => r.status === "approved").length;
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length
      : null;
    return {
      location: loc,
      total: reviews.length,
      avgRating: avg,
      replyRate: reviews.length === 0 ? 1 : replied / reviews.length,
      pendingCount: reviews.filter((r) => r.status === "pending" || r.status === "draft").length,
      urgentCount: reviews.filter((r) => r.stars <= 2 && r.status !== "approved" && r.status !== "discarded").length,
    };
  });

  const reviews = locationId ? reviewsForLocation(db, locationId) : db.reviews;
  return NextResponse.json({ stats, reviews });
}
