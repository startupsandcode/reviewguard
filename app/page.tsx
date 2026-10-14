export default function Home() {
  return (
    <>
      <div className="card">
        <h1>ReviewGuard (demo)</h1>
        <p>
          Google review triage for trade contractors: instant alerts, AI-drafted replies,
          owner approval before anything posts.
        </p>
        <p>
          This is a <strong>demo-mode MVP</strong>: everything runs on mock data in a local
          JSON store. There is no Google connection, no emails are sent, no replies are
          posted anywhere. The GBP reply POST and Resend email paths are stubbed.
        </p>
        <div className="btn-row">
          <a className="btn btn-primary" href="/dashboard">Open review inbox</a>
          <a className="btn btn-ghost" href="/digest">Weekly digest</a>
        </div>
      </div>
      <div className="card">
        <h2>The full loop (on mock data)</h2>
        <ol>
          <li>A mock review arrives via the demo "inject review" button (dev-only <code>/api/simulate</code>).</li>
          <li>An instant alert is logged — email via Resend is <em>stubbed</em> to console.log; nothing sends.</li>
          <li>An AI draft reply is generated from deterministic templates keyed on star tier
            (gracious 4-5, de-escalating 1-3; never defensive, never fabricating job facts).
            A documented seam shows where a real LLM call plugs in.</li>
          <li>The owner approves, edits, or discards. Nothing posts without approval; the
            GBP reply POST is stubbed.</li>
          <li>Weekly digest shows volume, average rating trend, and reply rate (email stubbed).</li>
        </ol>
        <h2>Compliance invariant</h2>
        <p>
          Every customer receives the identical feedback link — no sentiment or rating
          conditional routing anywhere (unit-tested; required by the April 2026 Google
          review-gating policy).
        </p>
        <h2>Production needs (deferred)</h2>
        <ul>
          <li>GBP API access-request form (~14-day review per Cloud project) — needs John's org identity.</li>
          <li>OAuth verification for the <code>business.manage</code> sensitive scope — weeks, brand + demo video.</li>
          <li>Postgres + real GBP OAuth/PubSub before launch.</li>
        </ul>
      </div>
    </>
  );
}
