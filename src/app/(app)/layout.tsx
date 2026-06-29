import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garde-fou : redirige vers /login si non connecté. Tout ce qui est rendu
  // ici part d'un membre authentifié, scoppé à son salon.
  const member = await requireMember();

  return (
    <AppShell
      salonName={member.salon.name}
      userLabel={member.name || member.email}
    >
      {children}
    </AppShell>
  );
}
