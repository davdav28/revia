"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reply, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { replyToContact } from "@/server/contact";

export function ContactReply({
  id,
  name,
  repliedAt,
  lastReply,
}: {
  id: string;
  name: string;
  repliedAt: string | null;
  lastReply: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const res = await replyToContact(id, body);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Réponse envoyée à ${name}.`);
      setBody("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="border-line mt-3 border-t pt-3">
      {repliedAt ? (
        <div className="mb-2">
          <span className="text-status-active inline-flex items-center gap-1.5 text-xs font-medium">
            <Check className="size-3.5" />
            Répondu le{" "}
            {new Date(repliedAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {lastReply ? (
            <p className="text-muted/80 mt-1 text-xs whitespace-pre-line italic">
              « {lastReply} »
            </p>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Votre réponse à ${name}…`}
            className="min-h-24"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={send} disabled={isPending || !body.trim()}>
              {isPending ? "Envoi…" : "Envoyer la réponse"}
            </Button>
          </div>
          <p className="text-muted/70 text-xs">
            Le prospect reçoit un email ; sa réponse revient sur{" "}
            {"contact@reviagence.com"}.
          </p>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Reply className="size-4" />
          {repliedAt ? "Répondre à nouveau" : "Répondre"}
        </Button>
      )}
    </div>
  );
}
