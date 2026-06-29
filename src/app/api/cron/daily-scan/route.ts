import { NextResponse, type NextRequest } from "next/server";
import { runScanAllSalons } from "@/lib/reactivation/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scan quotidien de réactivation (Vercel Cron). Idempotent : le cooldown par
 * cliente empêche tout double envoi si le job tourne plusieurs fois.
 * Authentifié par CRON_SECRET (en-tête Authorization: Bearer, ou ?secret=).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const provided =
      auth?.replace("Bearer ", "") ??
      new URL(req.url).searchParams.get("secret") ??
      "";
    if (provided !== secret) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const results = await runScanAllSalons();
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    results,
  });
}
