"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Suppression du compte (RGPD — droit à l'effacement) : efface le salon et
 * toutes ses données (cascade), puis l'utilisateur Supabase Auth.
 */
export async function deleteAccount(): Promise<void> {
  const member = await requireMember();
  const { id: userId, authId } = member;

  // Salons dont l'utilisateur est propriétaire : on supprime ceux dont il est
  // le SEUL propriétaire (cascade : clientes, RDV, messages, memberships…).
  const owned = await prisma.membership.findMany({
    where: { userId, role: "owner" },
    select: { salonId: true },
  });
  for (const { salonId } of owned) {
    const otherOwners = await prisma.membership.count({
      where: { salonId, role: "owner", NOT: { userId } },
    });
    if (otherOwners === 0) {
      await prisma.salon.delete({ where: { id: salonId } }).catch(() => {});
    }
  }

  // Supprime l'utilisateur s'il subsiste (il a pu être supprimé en cascade si
  // son salon d'origine faisait partie des salons effacés).
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});

  // Efface l'utilisateur d'authentification via l'API admin Supabase.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    await fetch(`${url}/auth/v1/admin/users/${authId}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).catch(() => {});
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/");
}
