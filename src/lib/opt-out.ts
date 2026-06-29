import { createHmac } from "node:crypto";

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "revia-dev-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret())
    .update(value)
    .digest("base64url")
    .slice(0, 24);
}

/** Jeton de désabonnement, à glisser dans les liens sortants (non devinable). */
export function createOptOutToken(clientId: string): string {
  return `${clientId}.${sign(clientId)}`;
}

export function verifyOptOutToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const clientId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!clientId || sign(clientId) !== sig) return null;
  return clientId;
}

/** URL publique de désabonnement pour une cliente. */
export function optOutUrl(clientId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/stop/${createOptOutToken(clientId)}`;
}
