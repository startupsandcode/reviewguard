"use client";

import { useState } from "react";

export default function InjectForm({ locations }: { locations: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function inject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reviewerName: String(form.get("reviewerName") || ""),
        stars: Number(form.get("stars")),
        comment: String(form.get("comment") || ""),
        locationId: String(form.get("locationId") || ""),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "inject failed");
      setBusy(false);
      return;
    }
    window.location.href = `/reviews/${data.review.id}`;
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Inject demo review
      </button>
    );
  }

  return (
    <div className="card">
      <h2>Inject mock review (dev-only)</h2>
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      <form className="form-grid" onSubmit={inject}>
        <label>
          Location
          <select name="locationId" style={{ width: "100%" }}>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </label>
        <input name="reviewerName" placeholder="Reviewer name (e.g. Sam Carter)" />
        <select name="stars" defaultValue="2">
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>{s} stars</option>
          ))}
        </select>
        <input name="comment" placeholder="Review text" />
        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Injecting..." : "Inject review"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
