/**
 * Accès admin (réservé au fondateur). La liste des emails autorisés vient de
 * `ADMIN_EMAILS` (séparés par des virgules) ; à défaut, l'email du fondateur.
 * Helper pur — utilisable côté serveur sans « use server ».
 */
const DEFAULT_ADMINS = ["reviagence@gmail.com"];

export function adminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ADMINS;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
