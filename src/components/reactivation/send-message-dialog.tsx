"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import type { MessageChannel } from "@prisma/client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { SMS_STOP_NOTICE } from "@/config/brand";
import {
  sendManualToClient,
  sendManualToSegment,
} from "@/server/manual-send";
import type { ClientFilterParams } from "@/lib/client-filters";

export type SendableTemplate = {
  id: string;
  name: string;
  channel: MessageChannel;
  scenario: string | null;
  subject: string | null;
  body: string;
};

type Common = { templates: SendableTemplate[]; trigger: ReactNode };
type Props = Common &
  (
    | { mode: "client"; clientId: string; clientName: string }
    | { mode: "segment"; filter: ClientFilterParams; count: number }
  );

export function SendMessageDialog(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(props.templates[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const selected = props.templates.find((t) => t.id === templateId);
  const recipients =
    props.mode === "client" ? 1 : props.count;

  function submit() {
    if (!templateId) return;
    startTransition(async () => {
      const res =
        props.mode === "client"
          ? await sendManualToClient(props.clientId, templateId)
          : await sendManualToSegment(props.filter, templateId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      const bits = [`${res.sent} envoyé${res.sent > 1 ? "s" : ""}`];
      const skipped =
        res.skipped.optedOut + res.skipped.noConsent + res.skipped.quotaCap;
      if (skipped > 0) bits.push(`${skipped} ignoré${skipped > 1 ? "s" : ""}`);
      if (res.failed > 0) bits.push(`${res.failed} échec${res.failed > 1 ? "s" : ""}`);
      toast.success(`Message : ${bits.join(" · ")}`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent
        className="max-w-lg"
        title="Envoyer un message"
        description={
          props.mode === "client"
            ? `À ${props.clientName}.`
            : `À ${recipients} client${recipients > 1 ? "s" : ""} de cette sélection.`
        }
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="tpl">Modèle</Label>
            <select
              id="tpl"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="border-line bg-surface text-ink focus-visible:ring-lacquer/40 h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            >
              {props.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.channel === "sms" ? "SMS" : "Email"}
                </option>
              ))}
            </select>
          </div>

          {selected ? (
            <div className="border-line bg-nude-soft/40 space-y-2 rounded-lg border p-3">
              {selected.channel === "email" && selected.subject ? (
                <p className="text-ink text-sm font-medium">
                  {selected.subject}
                </p>
              ) : null}
              <p className="text-muted text-sm whitespace-pre-line">
                {selected.body}
                {selected.channel === "sms" ? ` ${SMS_STOP_NOTICE}` : ""}
              </p>
              <p className="text-muted/70 text-xs">
                Les variables (prénom, salon, lien…) sont remplies
                automatiquement à l'envoi.
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={isPending || !templateId}>
              <Send className="size-4" />
              {isPending
                ? "Envoi…"
                : props.mode === "client"
                  ? "Envoyer"
                  : `Envoyer à ${recipients}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
