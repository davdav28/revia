import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Export RGPD : toutes les données du salon (portabilité). */
export async function GET() {
  const member = await requireMember();

  const salon = await prisma.salon.findUnique({
    where: { id: member.salonId },
    include: {
      services: true,
      clients: {
        include: {
          appointments: true,
          messages: true,
          recoveries: true,
        },
      },
      campaigns: true,
      templates: true,
    },
  });

  const json = JSON.stringify(
    { exportedAt: new Date().toISOString(), salon },
    null,
    2,
  );

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="revia-export-${member.salonId}.json"`,
    },
  });
}
