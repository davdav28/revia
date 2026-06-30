import { requireMember } from "@/lib/auth";
import { salonLimitFor } from "@/lib/team";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garde-fou : redirige vers /login si non connecté. Tout ce qui est rendu
  // ici part d'un membre authentifié, scoppé à son salon actif.
  const member = await requireMember();
  const limit = salonLimitFor(member.salon);
  const canAddSalon = limit === null || member.salons.length < limit;

  return (
    <AppShell
      salons={member.salons}
      activeSalonId={member.salonId}
      canAddSalon={canAddSalon}
      userLabel={member.name || member.email}
    >
      {children}
    </AppShell>
  );
}
