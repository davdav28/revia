import type { Metadata } from "next";
import { verifyOptOutToken } from "@/lib/opt-out";
import { Logo } from "@/components/brand/logo";
import { OptOutConfirm } from "./opt-out-confirm";

export const metadata: Metadata = { title: "Désabonnement" };

export default async function StopPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = !!verifyOptOutToken(token);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8">
        <Logo className="text-2xl" />
      </div>
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-8 shadow-[var(--shadow-card)]">
        {valid ? (
          <OptOutConfirm token={token} />
        ) : (
          <p className="text-muted text-center text-sm">
            Ce lien de désabonnement n'est plus valide.
          </p>
        )}
      </div>
    </div>
  );
}
