import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewGuard (Demo)",
  description: "Google review triage for trade contractors — demo mode, no real Google connection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="demo-banner">
          DEMO MODE: mock data only. No Google connection, no emails sent, no replies posted.
        </div>
        <nav className="nav">
          <a href="/">ReviewGuard</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/digest">Weekly digest</a>
        </nav>
        <main className="container">{children}</main>
        <footer className="footer">
          ReviewGuard demo. Every customer gets the same feedback link: no review gating, ever
          (April 2026 Google policy).
        </footer>
      </body>
    </html>
  );
}
