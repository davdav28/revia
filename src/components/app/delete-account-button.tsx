"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/server/account";

const CONFIRM_WORD = "SUPPRIMER";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-status-dormant hover:bg-status-dormant/10"
        >
          <Trash2 className="size-4" />
          Supprimer mon compte
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Supprimer définitivement votre compte"
        description="Toutes vos données (clients, rendez-vous, messages) seront effacées. Cette action est irréversible."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="confirm">
              Tapez « {CONFIRM_WORD} » pour confirmer
            </Label>
            <Input
              id="confirm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              disabled={value !== CONFIRM_WORD || isPending}
              className="bg-status-dormant hover:bg-status-dormant"
              onClick={() => startTransition(() => deleteAccount())}
            >
              {isPending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
