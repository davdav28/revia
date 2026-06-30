"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { roleLabel } from "@/lib/team";
import { revokeInvitation } from "@/server/team";

export function InvitationRow({
  invitation,
  canManage,
}: {
  invitation: { id: string; email: string; role: string; link: string };
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(invitation.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function revoke() {
    if (!window.confirm(`Annuler l'invitation de ${invitation.email} ?`)) return;
    startTransition(async () => {
      await revokeInvitation(invitation.id);
      toast.success("Invitation annulée.");
    });
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="bg-nude-soft text-muted flex size-9 items-center justify-center rounded-md">
        <Mail className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm">{invitation.email}</p>
        <p className="text-muted text-xs">En attente · {roleLabel(invitation.role)}</p>
      </div>
      {canManage ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copy}
            className="border-line bg-surface text-ink hover:bg-nude-soft flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copié" : "Lien"}
          </button>
          <button
            type="button"
            onClick={revoke}
            disabled={isPending}
            className="text-status-dormant hover:bg-status-dormant/10 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            Annuler
          </button>
        </div>
      ) : (
        <Badge tone="outline">En attente</Badge>
      )}
    </div>
  );
}
