"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { MessageChannel } from "@prisma/client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { countSegments } from "@/lib/sms-segments";
import { SMS_STOP_NOTICE, withStopNotice } from "@/config/brand";
import { updateTemplate } from "@/server/reactivation";

export type EditableTemplate = {
  id: string;
  name: string;
  channel: MessageChannel;
  subject: string | null;
  body: string;
};

function Form({
  template,
  onDone,
}: {
  template: EditableTemplate;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject ?? "");
  const [body, setBody] = useState(template.body);

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("subject", subject);
    fd.set("body", body);
    startTransition(async () => {
      const res = await updateTemplate(template.id, {}, fd);
      if (res.error || res.fieldErrors) {
        setError(
          res.error ??
            Object.values(res.fieldErrors ?? {})[0]?.[0] ??
            "Erreur.",
        );
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="tpl-name">Nom du modèle</Label>
        <Input
          id="tpl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {template.channel === "email" ? (
        <div className="space-y-1.5">
          <Label htmlFor="tpl-subject">Objet</Label>
          <Input
            id="tpl-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="tpl-body">Message</Label>
        <Textarea
          id="tpl-body"
          className="min-h-32"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted text-xs">
            Variables : {"{{prenom}}"}, {"{{salon}}"}, {"{{offre}}"},{" "}
            {"{{lien}}"}.
          </p>
          {template.channel === "sms" ? (
            <span
              className={cn(
                "tabular shrink-0 text-xs font-medium",
                countSegments(withStopNotice(body)) > 1
                  ? "text-status-at-risk"
                  : "text-muted",
              )}
            >
              = {countSegments(withStopNotice(body))} SMS
            </span>
          ) : null}
        </div>
        {template.channel === "sms" && SMS_STOP_NOTICE ? (
          <p className="text-muted text-xs">
            « {SMS_STOP_NOTICE} » est ajouté automatiquement à la fin (obligation
            légale) et compté dans les segments.
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export function TemplateEditDialog({
  template,
}: {
  template: EditableTemplate;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Modifier le modèle"
        description="Personnalisez le message envoyé à vos clientes."
      >
        {open ? (
          <Form
            key={template.id}
            template={template}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
