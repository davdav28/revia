"use client";

import { Trash2 } from "lucide-react";

export function DeleteServiceButton({
  action,
  name,
}: {
  action: () => Promise<void>;
  name: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer la prestation « ${name} » ?`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label={`Supprimer ${name}`}
        className="text-muted hover:bg-status-dormant/10 hover:text-status-dormant rounded-md p-1.5 transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
