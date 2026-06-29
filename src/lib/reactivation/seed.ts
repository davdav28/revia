import { prisma } from "@/lib/prisma";
import { DEFAULT_TEMPLATES, DEFAULT_CAMPAIGNS } from "@/lib/templates";

/**
 * Met en place les modèles de messages et les campagnes par défaut d'un salon.
 * Idempotent : ne fait rien si des campagnes existent déjà.
 */
export async function seedReactivationDefaults(salonId: string): Promise<void> {
  const existing = await prisma.campaign.count({ where: { salonId } });
  if (existing > 0) return;

  const keyToId = new Map<string, string>();
  for (const t of DEFAULT_TEMPLATES) {
    const created = await prisma.messageTemplate.create({
      data: {
        salonId,
        name: t.name,
        channel: t.channel,
        trigger: t.trigger,
        scenario: t.scenario,
        subject: t.subject,
        body: t.body,
      },
      select: { id: true },
    });
    keyToId.set(t.key, created.id);
  }

  for (const c of DEFAULT_CAMPAIGNS) {
    const templateId = keyToId.get(c.templateKey);
    if (!templateId) continue;
    await prisma.campaign.create({
      data: {
        salonId,
        name: c.name,
        trigger: c.trigger,
        channel: c.channel,
        isActive: c.isActive,
        templateId,
      },
    });
  }
}
