import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Salon, User, UserRole } from "@prisma/client";

/** Un salon auquel le membre a accès (pour le sélecteur de salon). */
export type AccessibleSalon = { id: string; name: string; role: UserRole };

/**
 * Le membre connecté, résolu sur son **salon actif**. `salonId`, `salon` et
 * `role` décrivent toujours le salon actuellement consulté — ce qui garde tout
 * le code métier existant (scoppé par `member.salonId`) inchangé. `salons`
 * liste tous les salons accessibles (multi-salon).
 */
export type Member = Omit<User, "role"> & {
  salonId: string;
  role: UserRole;
  salon: Salon;
  salons: AccessibleSalon[];
};

/**
 * Résout le membre connecté à partir de la session Supabase, sur son salon
 * actif (via `activeSalonId`, sinon le premier salon accessible). `cache`
 * garantit un seul appel par requête. Null si non connecté / sans salon.
 */
export const getCurrentMember = cache(async (): Promise<Member | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { memberships: { include: { salon: true } } },
  });

  if (!dbUser || dbUser.memberships.length === 0) return null;

  // Salon actif = activeSalonId si toujours accessible, sinon le premier.
  const active =
    dbUser.memberships.find((m) => m.salonId === dbUser.activeSalonId) ??
    dbUser.memberships[0];

  return {
    id: dbUser.id,
    authId: dbUser.authId,
    email: dbUser.email,
    name: dbUser.name,
    activeSalonId: dbUser.activeSalonId,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    role: active.role,
    salonId: active.salonId,
    salon: active.salon,
    salons: dbUser.memberships
      .map((m) => ({
        id: m.salon.id,
        name: m.salon.name,
        role: m.role,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
  };
});

/**
 * À utiliser dans les layouts/pages protégés : renvoie le membre ou redirige
 * vers /login. Toute requête métier doit partir de `member.salonId` — c'est
 * notre garde-fou multi-tenant côté serveur.
 */
export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

/**
 * Comme `requireMember`, mais réservé au propriétaire du salon actif (gestion
 * de l'équipe, facturation). Un membre « staff » est renvoyé au tableau de bord.
 */
export async function requireOwner(): Promise<Member> {
  const member = await requireMember();
  if (member.role !== "owner") redirect("/dashboard");
  return member;
}

/**
 * Réservé au fondateur (outils internes : facturation sur-mesure…). Toute
 * personne non listée dans `ADMIN_EMAILS` est renvoyée au tableau de bord.
 */
export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (!isAdminEmail(member.email)) redirect("/dashboard");
  return member;
}
