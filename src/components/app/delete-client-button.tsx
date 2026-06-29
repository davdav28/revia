"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({
  action,
  clientName,
}: {
  action: () => Promise<void>;
  clientName: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Supprimer ${clientName} ? Cette action est définitive.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-status-dormant hover:bg-status-dormant/10"
      >
        <Trash2 className="size-4" />
        Supprimer
      </Button>
    </form>
  );
}
