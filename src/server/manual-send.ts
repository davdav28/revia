"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/subscription";
import {
  buildClientWhere,
  type ClientFilterParams,
} from "@/lib/client-filters";
import { deliverToClients, type DeliverResult } from "@/lib/reactivation/deliver";

export type ManualSendResult = DeliverResult | { error: string };

function guard(status: string): string | null {
  if (!isSubscriptionActive(status)) {
    return "Abonnement inactif : activez une formule pour envoyer des messages.";
  }
  return null;
}

/** Envoie un modèle à un client précis. */
export async function sendManualToClient(
  clientId: string,
  templateId: string,
): Promise<ManualSendResult> {
  const member = await requireMember();
  const err = guard(member.salon.subscriptionStatus);
  if (err) return { error: err };

  const client = await prisma.client.findFirst({
    where: { id: clientId, salonId: member.salonId },
    select: { id: true },
  });
  if (!client) return { error: "Client introuvable." };

  const res = await deliverToClients({
    salonId: member.salonId,
    templateId,
    clientIds: [clientId],
  });
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/relances");
  return res;
}

/** Envoie un modèle à tous les clients d'un segment (filtres de la liste). */
export async function sendManualToSegment(
  filter: ClientFilterParams,
  templateId: string,
): Promise<ManualSendResult> {
  const member = await requireMember();
  const err = guard(member.salon.subscriptionStatus);
  if (err) return { error: err };

  const where = buildClientWhere(member.salonId, filter);
  const clients = await prisma.client.findMany({
    where,
    select: { id: true },
    take: 2000,
  });
  if (clients.length === 0) return { error: "Aucun client dans cette sélection." };

  const res = await deliverToClients({
    salonId: member.salonId,
    templateId,
    clientIds: clients.map((c) => c.id),
  });
  revalidatePath("/clientes");
  revalidatePath("/relances");
  return res;
}

/** Liste des modèles actifs du salon, pour le sélecteur d'envoi. */
export async function listSendableTemplates() {
  const member = await requireMember();
  return prisma.messageTemplate.findMany({
    where: { salonId: member.salonId, isActive: true },
    select: {
      id: true,
      name: true,
      channel: true,
      scenario: true,
      subject: true,
      body: true,
    },
    orderBy: { name: "asc" },
  });
}
