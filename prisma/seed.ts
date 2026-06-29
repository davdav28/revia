/**
 * Seed de démonstration Revia — salon de démo séparé, désactivable.
 *
 * Crée (de façon idempotente) :
 *  - un utilisateur Supabase Auth connectable : demo@revia.app / DemoRevia2026
 *  - un salon « Salon Démo Revia » + son catalogue de prestations
 *  - ~80 clientes avec un historique de visites étalé sur 6 mois, produisant
 *    un mélange réaliste de statuts (active / à surveiller / à relancer).
 *
 * Lancer :  npm run db:seed
 * Pour le désactiver : supprimer le salon « Salon Démo Revia » (Réglages ou DB).
 */
import { PrismaClient, type ClientStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = "demo@revia.app";
const DEMO_PASSWORD = "DemoRevia2026";
const SALON_NAME = "Salon Démo Revia";

const DEFAULT_SERVICES = [
  {
    name: "Pose gel (pose complète)",
    priceCents: 4500,
    defaultIntervalDays: 28,
  },
  { name: "Pose semi-permanent", priceCents: 3500, defaultIntervalDays: 21 },
  { name: "Remplissage gel", priceCents: 3000, defaultIntervalDays: 21 },
  { name: "Nail art", priceCents: 1000, defaultIntervalDays: null },
  { name: "Dépose", priceCents: 1500, defaultIntervalDays: null },
];

const PRENOMS = [
  "Camille",
  "Léa",
  "Manon",
  "Chloé",
  "Inès",
  "Sarah",
  "Emma",
  "Jade",
  "Louise",
  "Lina",
  "Anaïs",
  "Clara",
  "Julie",
  "Marine",
  "Océane",
  "Nadia",
  "Fatima",
  "Aurélie",
  "Sophie",
  "Élodie",
  "Margaux",
  "Pauline",
  "Laura",
  "Mélanie",
  "Céline",
  "Amel",
  "Yasmine",
  "Lucie",
  "Charlotte",
  "Maëva",
];
const NOMS = [
  "Martin",
  "Bernard",
  "Dubois",
  "Petit",
  "Robert",
  "Durand",
  "Moreau",
  "Laurent",
  "Simon",
  "Michel",
  "Garcia",
  "Roux",
  "Fontaine",
  "Girard",
  "Lefebvre",
  "Mercier",
  "Blanc",
  "Faure",
  "Rousseau",
  "Lemaire",
  "Perrin",
];

const DAY = 86_400_000;

function computeStatus(lastVisitAt: Date | null, now: Date): ClientStatus {
  if (!lastVisitAt) return "active";
  const days = Math.floor((now.getTime() - lastVisitAt.getTime()) / DAY);
  if (days <= 28) return "active";
  if (days <= 49) return "at_risk";
  return "dormant";
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function authHeaders() {
  return {
    apikey: SERVICE_KEY!,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function ensureAuthUser(): Promise<string> {
  const headers = await authHeaders();
  const list = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, {
    headers,
  }).then((r) => r.json());
  const found = (list.users ?? []).find(
    (u: { id: string; email: string }) => u.email === DEMO_EMAIL,
  );
  if (found) return found.id;

  const created = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    }),
  }).then((r) => r.json());
  if (!created.id) {
    throw new Error(
      `Création utilisateur démo échouée : ${JSON.stringify(created)}`,
    );
  }
  return created.id;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (lancez via npm run db:seed).",
    );
  }

  const authId = await ensureAuthUser();

  const existing = await prisma.user.findUnique({
    where: { authId },
    include: { salon: { include: { _count: { select: { clients: true } } } } },
  });
  if (existing && existing.salon._count.clients > 0) {
    console.log(
      `Salon démo déjà peuplé (${existing.salon._count.clients} clientes). Rien à faire.`,
    );
    return;
  }

  const salon =
    existing?.salon ??
    (await prisma.salon.create({
      data: {
        name: SALON_NAME,
        users: {
          create: { authId, email: DEMO_EMAIL, name: "Démo", role: "owner" },
        },
        services: { create: DEFAULT_SERVICES },
      },
    }));

  const now = new Date();
  const TOTAL = 80;

  for (let i = 0; i < TOTAL; i++) {
    const firstName = pick(PRENOMS, i);
    const lastName = pick(NOMS, i * 7);
    const phone = "06" + String(20000000 + i * 137911).slice(0, 8);
    const email =
      `${firstName}.${lastName}${i}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9.]/g, "") + "@email.fr";

    // Profil de récence : ~35% actives, ~20% à surveiller, ~35% dormantes, ~10% sans visite.
    const bucket = i % 20;
    let lastDaysAgo: number | null;
    if (bucket < 7) lastDaysAgo = 2 + ((i * 3) % 24);
    else if (bucket < 11) lastDaysAgo = 30 + ((i * 5) % 18);
    else if (bucket < 18) lastDaysAgo = 55 + ((i * 11) % 130);
    else lastDaysAgo = null;

    const appts: { startAt: Date; amountCents: number }[] = [];
    if (lastDaysAgo !== null) {
      const numVisits = 1 + ((i * 2) % 4); // 1 à 4 visites
      for (let v = 0; v < numVisits; v++) {
        const daysAgo = lastDaysAgo + v * (24 + (i % 10));
        if (daysAgo > 200) break; // on reste dans la fenêtre ~6 mois
        appts.push({
          startAt: new Date(now.getTime() - daysAgo * DAY),
          amountCents: 2500 + ((i + v) % 4) * 1000,
        });
      }
    }

    const lastVisitAt =
      appts.reduce<Date | null>(
        (max, a) => (!max || a.startAt > max ? a.startAt : max),
        null,
      ) ?? null;
    const visitCount = appts.length;
    const totalSpendCents = appts.reduce((s, a) => s + a.amountCents, 0);
    const averageSpendCents = visitCount
      ? Math.round(totalSpendCents / visitCount)
      : 0;
    const consent = i % 3 !== 0;

    await prisma.client.create({
      data: {
        salonId: salon.id,
        firstName,
        lastName,
        phone,
        email,
        smsConsent: consent,
        smsConsentAt: consent ? now : null,
        emailConsent: consent,
        emailConsentAt: consent ? now : null,
        lastVisitAt,
        visitCount,
        totalSpendCents,
        averageSpendCents,
        status: computeStatus(lastVisitAt, now),
        appointments: {
          create: appts.map((a) => ({
            salonId: salon.id,
            startAt: a.startAt,
            status: "completed" as const,
            source: "import" as const,
            amountCents: a.amountCents,
          })),
        },
      },
    });
  }

  console.log(`✅ Seed terminé : ${TOTAL} clientes dans « ${SALON_NAME} ».`);
  console.log(`   Connexion démo : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
