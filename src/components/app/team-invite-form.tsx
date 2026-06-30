"use client";

import { useState, useTransition } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { inviteMember } from "@/server/team";

export function TeamInviteForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "owner">("staff");
  const [created, setCreated] = useState<{
    link: string;
    emailSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      const res = await inviteMember(email.trim(), role);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setCreated({ link: res.link, emailSent: res.emailSent });
      setEmail("");
      toast.success(
        res.emailSent
          ? "Invitation envoyée par email."
          : "Invitation créée — copiez le lien.",
      );
    });
  }

  function copy() {
    if (!created) return;
    navigator.clipboard?.writeText(created.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="invite-email">Email du coéquipier</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collegue@salon.fr"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Rôle</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as "staff" | "owner")}
            className="border-line bg-surface text-ink focus-visible:border-lacquer h-10 rounded-md border px-3 text-sm outline-none"
          >
            <option value="staff">Équipe</option>
            <option value="owner">Propriétaire</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Envoi…" : "Inviter"}
          </Button>
        </div>
      </form>

      {created ? (
        <div className="border-line bg-base space-y-2 rounded-md border p-3">
          <p className="text-muted text-xs">
            {created.emailSent
              ? "Un email a été envoyé. Vous pouvez aussi partager ce lien :"
              : "Partagez ce lien d'invitation (valable 14 jours) :"}
          </p>
          <div className="flex items-center gap-2">
            <code className="border-line bg-surface text-muted flex-1 truncate rounded border px-2 py-1.5 text-xs">
              {created.link}
            </code>
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
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
