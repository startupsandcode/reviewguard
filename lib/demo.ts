// Demo-mode flag shared by the dev-only simulate endpoint and the dashboard.
// REVIEWGUARD_DEMO=true enables mock review injection. Disabled by default
// everywhere (including dev); never set in real production — production uses
// real GBP Pub/Sub events, never simulation.

export function isDemoMode(): boolean {
  return process.env.REVIEWGUARD_DEMO === "true";
}
