"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seatLimitFor, joinUrl } from "@/lib/team";
import { inviteSchema, acceptInviteSchema } from "@/lib/validations/team";
import { getMessagingProvider } from "@/lib/messaging";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BRAND } from "@/config/brand";

const INVITE_TTL_DAYS = 14;

export type InviteResult =
  | { ok: true; link: string; emailSent: boolean }
  | { error: string };

/** Sièges occupés = membres (memberships) + invitations en attente. */
async function usedSeats(salonId: string): Promise<number> {
  const [members, pending] = await Promise.all([
    prisma.membership.count({ where: { salonId } }),
    prisma.invitation.count({ where: { salonId, status: "pending" } }),
  ]);
  return members + pending;
}

/** Invite un coéquipier par email (réservé au propriétaire). */
export async function inviteMember(
  email: string,
  role: "owner" | "staff",
): Promise<InviteResult> {
  const member = await requireOwner();
  const parsed = inviteSchema.safeParse({ email, role });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const normEmail = parsed.data.email.toLowerCase();

  // Déjà membre de ce salon ?
  const already = await prisma.membership.findFirst({
    where: { salonId: member.salonId, user: { email: normEmail } },
    select: { id: true },
  });
  if (already) return { error: "Cette personne fait déjà partie de l'équipe." };

  // Plafond de sièges du plan.
  const limit = seatLimitFor(member.salon);
  if (limit !== null && (await usedSeats(member.salonId)) >= limit) {
    return {
      error: `Votre formule est limitée à ${limit} utilisateur${limit > 1 ? "s" : ""}. Passez à une formule supérieure pour agrandir l'équipe.`,
    };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400_000);

  // Upsert : ré-inviter le même email remplace l'invitation (nouveau lien).
  await prisma.invitation.upsert({
    where: { salonId_email: { salonId: member.salonId, email: normEmail } },
    create: {
      salonId: member.salonId,
      email: normEmail,
      role: parsed.data.role,
      token,
      status: "pending",
      expiresAt,
      invitedByName: member.name ?? null,
    },
    update: {
      role: parsed.data.role,
      token,
      status: "pending",
      expiresAt,
      acceptedAt: null,
      invitedByName: member.name ?? null,
    },
  });

  const link = joinUrl(token);

  // Email best-effort (n'empêche jamais l'invitation : le lien est aussi
  // affiché dans l'interface pour être copié à la main).
  let emailSent = false;
  try {
    const provider = getMessagingProvider();
    const res = await provider.sendEmail({
      to: normEmail,
      subject: `${member.salon.name} vous invite à rejoindre ${BRAND.name}`,
      html: `<div><p>Bonjour,</p><p>${member.name ? `${member.name} (` : ""}${member.salon.name}${member.name ? ")" : ""} vous invite à rejoindre son équipe sur ${BRAND.name}.</p><p><a href="${link}">Rejoindre l'équipe</a></p><p>Ce lien expire dans ${INVITE_TTL_DAYS} jours.</p></div>`,
      senderEmail: process.env.BREVO_EMAIL_SENDER ?? "contact@revia.app",
      senderName: BRAND.name,
    });
    emailSent = res.ok;
  } catch {
    // Silencieux : le lien reste copiable depuis l'interface.
  }

  revalidatePath("/reglages/equipe");
  return { ok: true, link, emailSent };
}

/** Annule une invitation en attente (propriétaire). */
export async function revokeInvitation(invitationId: string): Promise<void> {
  const member = await requireOwner();
  // deleteMany borné au salon : garde-fou multi-tenant.
  await prisma.invitation.deleteMany({
    where: { id: invitationId, salonId: member.salonId },
  });
  revalidatePath("/reglages/equipe");
}

/** Change le rôle d'un membre dans le salon actif (propriétaire). */
export async function changeMemberRole(
  userId: string,
  role: "owner" | "staff",
): Promise<{ error?: string }> {
  const member = await requireOwner();
  const target = await prisma.membership.findUnique({
    where: { userId_salonId: { userId, salonId: member.salonId } },
  });
  if (!target) return { error: "Membre introuvable." };

  if (target.role === "owner" && role !== "owner") {
    const owners = await prisma.membership.count({
      where: { salonId: member.salonId, role: "owner" },
    });
    if (owners <= 1)
      return { error: "Il doit rester au moins un propriétaire." };
  }

  await prisma.membership.update({
    where: { userId_salonId: { userId, salonId: member.salonId } },
    data: { role },
  });
  revalidatePath("/reglages/equipe");
  return {};
}

/**
 * Retire un membre du salon actif : supprime son accès (membership). Si c'était
 * son seul salon, on supprime aussi son compte (User + Supabase Auth).
 */
export async function removeMember(
  userId: string,
): Promise<{ error?: string }> {
  const member = await requireOwner();
  if (userId === member.id)
    return { error: "Vous ne pouvez pas vous retirer vous-même." };

  const target = await prisma.membership.findUnique({
    where: { userId_salonId: { userId, salonId: member.salonId } },
    include: { user: { include: { _count: { select: { memberships: true } } } } },
  });
  if (!target) return { error: "Membre introuvable." };

  if (target.role === "owner") {
    const owners = await prisma.membership.count({
      where: { salonId: member.salonId, role: "owner" },
    });
    if (owners <= 1)
      return { error: "Il doit rester au moins un propriétaire." };
  }

  // Retire l'accès à ce salon.
  await prisma.membership.delete({
    where: { userId_salonId: { userId, salonId: member.salonId } },
  });

  // Si c'était son unique salon, on supprime le compte entièrement.
  if (target.user._count.memberships <= 1) {
    await prisma.user.delete({ where: { id: userId } });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      await fetch(`${url}/auth/v1/admin/users/${target.user.authId}`, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }).catch(() => {});
    }
  } else if (target.user.activeSalonId === member.salonId) {
    // Sinon, si ce salon était son salon actif, on le réinitialise.
    await prisma.user.update({
      where: { id: userId },
      data: { activeSalonId: null },
    });
  }

  revalidatePath("/reglages/equipe");
  return {};
}

export type AcceptState = {
  error?: string;
  message?: string;
};

/**
 * Acceptation d'une invitation : crée le compte Supabase + le membre rattaché
 * au salon invitant (sans créer de nouveau salon). Marque l'invitation acceptée.
 */
export async function acceptInvitationAction(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const invite = await prisma.invitation.findUnique({
    where: { token: parsed.data.token },
  });
  if (!invite || invite.status !== "pending") {
    return { error: "Cette invitation n'est plus valide." };
  }
  if (invite.expiresAt < new Date()) {
    return { error: "Cette invitation a expiré. Demandez-en une nouvelle." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: invite.email,
      password: parsed.data.password,
      options: { data: { name: parsed.data.name || null } },
    });

    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("already registered") || m.includes("already been"))
        return {
          error:
            "Un compte existe déjà avec cet email. Connectez-vous, ou demandez une invitation sur une autre adresse.",
        };
      return { error: "Inscription impossible. Réessayez." };
    }
    if (!data.user) return { error: "Inscription impossible. Réessayez." };

    // Rattache le membre au salon invitant (idempotent sur authId).
    let dbUser = await prisma.user.findUnique({
      where: { authId: data.user.id },
    });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          authId: data.user.id,
          email: invite.email,
          name: parsed.data.name || null,
          role: invite.role,
          salonId: invite.salonId,
          activeSalonId: invite.salonId,
        },
      });
    }
    // Accès au salon (membership) + salon actif.
    await prisma.membership.upsert({
      where: {
        userId_salonId: { userId: dbUser.id, salonId: invite.salonId },
      },
      create: { userId: dbUser.id, salonId: invite.salonId, role: invite.role },
      update: { role: invite.role },
    });
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });

    if (!data.session) {
      return {
        message:
          "Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.",
      };
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: "Erreur d'enregistrement. Réessayez." };
    }
    return { error: "Une erreur est survenue. Réessayez." };
  }

  return { message: "ok" };
}
