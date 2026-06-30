"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { changeMemberRole, removeMember } from "@/server/team";

export function MemberRow({
  member,
  isCurrentUser,
  canManage,
}: {
  member: { id: string; name: string | null; email: string; role: string };
  isCurrentUser: boolean;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const initial = (member.name || member.email).charAt(0).toUpperCase();

  function setRole(role: "owner" | "staff") {
    if (role === member.role) return;
    startTransition(async () => {
      const res = await changeMemberRole(member.id, role);
      if (res.error) toast.error(res.error);
      else toast.success("Rôle mis à jour.");
    });
  }

  function remove() {
    if (
      !window.confirm(
        `Retirer ${member.name || member.email} de l'équipe ? Son accès sera supprimé.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await removeMember(member.id);
      if (res.error) toast.error(res.error);
      else toast.success("Membre retiré.");
    });
  }

  // Le propriétaire peut gérer les autres membres, mais pas lui-même ici.
  const manageable = canManage && !isCurrentUser;

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="bg-nude text-ink flex size-9 items-center justify-center rounded-full text-sm font-semibold">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm font-medium">
          {member.name || member.email}
          {isCurrentUser ? (
            <span className="text-muted font-normal"> · vous</span>
          ) : null}
        </p>
        <p className="text-muted truncate text-xs">{member.email}</p>
      </div>

      {manageable ? (
        <div className="flex items-center gap-1.5">
          <select
            value={member.role}
            disabled={isPending}
            onChange={(e) => setRole(e.target.value as "owner" | "staff")}
            className="border-line bg-surface text-ink h-8 rounded-md border px-2 text-xs outline-none"
            aria-label="Rôle du membre"
          >
            <option value="staff">Équipe</option>
            <option value="owner">Propriétaire</option>
          </select>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="text-status-dormant hover:bg-status-dormant/10 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            Retirer
          </button>
        </div>
      ) : (
        <Badge tone="nude">{member.role === "owner" ? "Propriétaire" : "Équipe"}</Badge>
      )}
    </div>
  );
}
