import { NextResponse } from "next/server";
import { computeDigest, renderDigestText, sendDigestEmailStub } from "@/lib/digest";
import { loadDb, logDigest, saveDb } from "@/lib/store";

// GET /api/digest — weekly digest JSON (volume, rating trend, reply rate)
export async function GET() {
  const db = loadDb();
  const digest = computeDigest(db);
  return NextResponse.json(digest);
}

// POST /api/digest — "send" the weekly digest (STUBBED in demo mode)
export async function POST() {
  const db = loadDb();
  const digest = computeDigest(db);
  const result = await sendDigestEmailStub(digest); // console.log only; nothing sent
  const at = new Date().toISOString();
  logDigest(db, { at, period: `${digest.period.from.slice(0, 10)} -> ${digest.period.to.slice(0, 10)}`, sent: result.sent });
  saveDb(db);
  return NextResponse.json({ digest, text: renderDigestText(digest), ...result });
}
