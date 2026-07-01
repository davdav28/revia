import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Notifications récentes + compteur de non-lus pour le salon actif. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ unread: 0, items: [] }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { salonId: member.salonId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        url: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { salonId: member.salonId, readAt: null },
    }),
  ]);

  return NextResponse.json({ unread, items });
}
