import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { seatLimitFor, joinUrl, roleLabel } from "@/lib/team";
import { TeamInviteForm } from "@/components/app/team-invite-form";
import { InvitationRow } from "@/components/app/invitation-row";
import { MemberRow } from "@/components/app/member-row";

export const metadata: Metadata = { title: "Équipe" };

export default async function EquipePage() {
  const member = await requireMember();
  const isOwner = member.role === "owner";

  const [members, invitations] = await Promise.all([
    prisma.user.findMany({
      where: { salonId: member.salonId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.invitation.findMany({
      where: { salonId: member.salonId, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const limit = seatLimitFor(member.salon);
  const used = members.length + invitations.length;
  const limitLabel = limit === null ? "illimité" : String(limit);
  const full = limit !== null && used >= limit;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/reglages"
        className="text-muted hover:text-ink inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour aux réglages
      </Link>

      <PageHeader
        title="Équipe"
        description="Invitez vos collègues à accéder au salon. Chacun a son propre compte."
      />

      <div className="border-line bg-surface flex items-center justify-between gap-4 rounded-lg border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-nude-soft text-lacquer-ink flex size-10 items-center justify-center rounded-md">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-ink text-sm font-medium">Sièges utilisés</p>
            <p className="text-muted text-sm">
              {member.salon.plan
                ? "Selon votre formule"
                : "Pendant l'essai"}{" "}
              · {limitLabel === "illimité" ? "illimités" : `max ${limitLabel}`}
            </p>
          </div>
        </div>
        <span className="tabular text-ink text-lg font-semibold">
          {used} / {limitLabel}
        </span>
      </div>

      {/* Invitation (propriétaire uniquement) */}
      {isOwner ? (
        <div className="border-line bg-surface space-y-4 rounded-lg border p-5">
          <h2 className="font-display text-ink font-semibold">
            Inviter un coéquipier
          </h2>
          {full ? (
            <p className="border-status-at-risk/30 bg-status-at-risk/10 text-status-at-risk rounded-md border px-3 py-2 text-sm">
              Votre formule est complète ({limitLabel} sièges). Passez à une
              formule supérieure pour agrandir l'équipe.
            </p>
          ) : (
            <TeamInviteForm />
          )}
        </div>
      ) : null}

      {/* Membres */}
      <section className="space-y-3">
        <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
          Membres ({members.length})
        </h2>
        <div className="divide-line border-line bg-surface divide-y overflow-hidden rounded-lg border">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={{
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
              }}
              isCurrentUser={m.id === member.id}
              canManage={isOwner}
            />
          ))}
        </div>
      </section>

      {/* Invitations en attente */}
      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-muted text-sm font-semibold tracking-widest uppercase">
            Invitations en attente ({invitations.length})
          </h2>
          <div className="divide-line border-line bg-surface divide-y overflow-hidden rounded-lg border">
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={{
                  id: inv.id,
                  email: inv.email,
                  role: inv.role,
                  link: joinUrl(inv.token),
                }}
                canManage={isOwner}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isOwner ? (
        <p className="text-muted text-sm">
          Vous êtes <Badge tone="nude">{roleLabel(member.role)}</Badge>. Seul le
          propriétaire peut inviter ou retirer des membres.
        </p>
      ) : null}
    </div>
  );
}
