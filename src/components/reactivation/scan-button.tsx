"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { runScanNow } from "@/server/reactivation";

export function ScanButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const s = await runScanNow();
      const parts = [`${s.messagesSent} message(s) envoyé(s)`];
      if (s.recoveriesCreated > 0)
        parts.push(`${s.recoveriesCreated} réactivation(s)`);
      if (s.messagesFailed > 0) parts.push(`${s.messagesFailed} échec(s)`);
      toast.success(`Scan terminé : ${parts.join(" · ")}`);
      router.refresh();
    });
  }

  return (
    <Button onClick={run} disabled={isPending}>
      <Play className="size-4" />
      {isPending ? "Scan en cours…" : "Lancer le scan"}
    </Button>
  );
}
