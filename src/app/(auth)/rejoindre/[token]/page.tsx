import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/team";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Rejoindre une équipe" };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { salon: { select: { name: true } } },
  });

  const invalid =
    !invite || invite.status !== "pending" || invite.expiresAt < new Date();

  if (invalid) {
    return (
      <div>
        <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
          Invitation indisponible
        </h1>
        <p className="text-muted mt-2 text-sm">
          Ce lien d'invitation n'est plus valide ou a expiré. Demandez au
          propriétaire du salon de vous en envoyer un nouveau.
        </p>
        <Link
          href="/login"
          className="text-lacquer-ink mt-6 inline-block text-sm font-medium hover:underline"
        >
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-ink text-2xl font-bold tracking-tight">
        Rejoindre {invite.salon.name}
      </h1>
      <p className="text-muted mt-1 text-sm">
        Vous êtes invité·e en tant que{" "}
        <span className="text-ink font-medium">
          {roleLabel(invite.role).toLowerCase()}
        </span>
        . Créez votre accès personnel.
      </p>
      <div className="mt-8">
        <JoinForm token={token} email={invite.email} />
      </div>
    </div>
  );
}
