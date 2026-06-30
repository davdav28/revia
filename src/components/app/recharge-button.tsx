"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { formatCents } from "@/lib/money";
import { buyRecharge } from "@/server/subscription";

/** Achat d'un pack de recharge SMS (Checkout Stripe, ou simulé en démo). */
export function RechargeButton({
  segments,
  priceCents,
  stripeConfigured,
}: {
  segments: number;
  priceCents: number;
  stripeConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function buy() {
    startTransition(async () => {
      const res = await buyRecharge();
      if ("url" in res) {
        window.location.href = res.url;
      } else if ("ok" in res) {
        toast.success(`${segments} segments ajoutés.`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={buy}
      disabled={isPending}
      title={stripeConfigured ? undefined : "Simulé en mode démonstration"}
    >
      <Plus className="size-4" />
      Recharger {segments} SMS · {formatCents(priceCents)}
    </Button>
  );
}
