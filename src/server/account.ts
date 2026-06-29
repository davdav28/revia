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
  const authId = member.authId;

  // Efface le salon (cascade : clientes, RDV, messages, recoveries, etc.).
  await prisma.salon.delete({ where: { id: member.salonId } });

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
