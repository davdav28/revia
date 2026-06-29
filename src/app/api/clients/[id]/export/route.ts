import { NextResponse, type NextRequest } from "next/server";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Export RGPD des données d'une cliente (droit d'accès / portabilité). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await requireMember();

  const client = await prisma.client.findFirst({
    where: { id, salonId: member.salonId },
    include: { appointments: true, messages: true, recoveries: true },
  });
  if (!client) {
    return new NextResponse("Introuvable", { status: 404 });
  }

  const json = JSON.stringify(
    { exportedAt: new Date().toISOString(), client },
    null,
    2,
  );

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cliente-${client.id}.json"`,
    },
  });
}
