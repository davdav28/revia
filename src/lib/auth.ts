import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Salon, User } from "@prisma/client";

export type Member = User & { salon: Salon };

/**
 * Résout le membre connecté (notre `User` + son `Salon`) à partir de la
 * session Supabase. `cache` garantit un seul appel par requête.
 * Retourne null si non connecté ou si le membre n'existe pas encore en base.
 */
export const getCurrentMember = cache(async (): Promise<Member | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const member = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { salon: true },
  });

  return member;
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
