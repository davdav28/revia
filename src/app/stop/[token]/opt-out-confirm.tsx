"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmOptOut } from "../actions";

export function OptOutConfirm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-status-active/10 text-status-active flex size-12 items-center justify-center rounded-full">
          <CheckCircle2 className="size-6" />
        </div>
        <p className="font-display text-ink font-semibold">
          Vous êtes désabonnée
        </p>
        <p className="text-muted text-sm">
          Vous ne recevrez plus de messages. À bientôt peut-être.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-muted">
        Souhaitez-vous ne plus recevoir de messages de votre salon ?
      </p>
      <Button
        onClick={() =>
          startTransition(async () => {
            const r = await confirmOptOut(token);
            if (r.ok) setDone(true);
          })
        }
        disabled={isPending}
      >
        {isPending ? "…" : "Me désabonner"}
      </Button>
    </div>
  );
}
