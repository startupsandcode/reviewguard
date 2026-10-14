import { NextResponse } from "next/server";
import { getReview, loadDb } from "@/lib/store";

// GET /api/reviews/[id]
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = loadDb();
  const review = getReview(db, id);
  if (!review) return NextResponse.json({ error: "review not found" }, { status: 404 });
  const location = db.locations.find((l) => l.id === review.locationId);
  return NextResponse.json({ review, location });
}
