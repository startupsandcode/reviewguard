"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";

export default function ReviewActions({ review }: { review: Review }) {
  const [draft, setDraft] = useState(review.draftText ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(path: string, body?: object) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(`Error: ${data.error || "request failed"}`);
      return;
    }
    window.location.reload();
  }

  if (review.status === "approved") {
    return (
      <div className="card">
        <h2>Reply posted (demo: recorded locally, not sent to Google)</h2>
        <p>{review.replyText}</p>
      </div>
    );
  }
  if (review.status === "discarded") {
    return (
      <div className="card">
        <h2>Discarded</h2>
        <p>This review was discarded; no reply will be posted.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Draft reply (AI template, editable)</h2>
      {msg && <p style={{ color: "#c0392b" }}>{msg}</p>}
      <textarea
        className="draft"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={review.status === "pending" ? "Generate a draft first" : "Edit the draft..."}
      />
      <div className="btn-row">
        {review.status === "pending" && (
          <button className="btn btn-primary" disabled={busy} onClick={() => call(`/api/reviews/${review.id}/draft`)}>
            Generate draft
          </button>
        )}
        {review.status === "draft" && (
          <>
            <button className="btn btn-primary" disabled={busy || !draft.trim()} onClick={() => call(`/api/reviews/${review.id}/approve`, { text: draft })}>
              Approve and record reply
            </button>
            <button className="btn btn-ghost" disabled={busy || !draft.trim()} onClick={() => call(`/api/reviews/${review.id}/edit`, { text: draft })}>
              Save edit
            </button>
            <button className="btn btn-danger" disabled={busy} onClick={() => call(`/api/reviews/${review.id}/discard`)}>
              Discard
            </button>
          </>
        )}
      </div>
      <p style={{ fontSize: 12, color: "#888" }}>
        Approval-only MVP: nothing posts to Google in demo mode. Reply bursts are paced
        (max 10 approvals/min per location).
      </p>
    </div>
  );
}
