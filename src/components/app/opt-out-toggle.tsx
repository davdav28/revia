"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellOff, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setClientOptOut } from "@/server/reactivation";

export function OptOutToggle({
  clientId,
  optedOut,
}: {
  clientId: string;
  optedOut: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setClientOptOut(clientId, !optedOut);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={isPending}
      className={optedOut ? "text-status-active" : "text-muted"}
    >
      {optedOut ? (
        <>
          <Bell className="size-4" />
          Réautoriser le contact
        </>
      ) : (
        <>
          <BellOff className="size-4" />
          Ne plus contacter
        </>
      )}
    </Button>
  );
}
