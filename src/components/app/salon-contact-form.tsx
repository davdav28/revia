"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { setSalonContact } from "@/server/salon";

/** Saisie de l'adresse + téléphone du salon (affichés sur la page de réservation). */
export function SalonContactForm({
  address,
  phone,
}: {
  address: string;
  phone: string;
}) {
  const router = useRouter();
  const [a, setA] = useState(address);
  const [p, setP] = useState(phone);
  const [isPending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await setSalonContact({ address: a, phone: p });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Coordonnées enregistrées.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="salon-address">Adresse</Label>
        <Input
          id="salon-address"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="12 rue des Ongles, 75011 Paris"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="salon-phone">Téléphone</Label>
        <Input
          id="salon-phone"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="01 23 45 67 89"
          inputMode="tel"
        />
      </div>
      <p className="text-muted text-xs">
        Affichés sur votre page de réservation (avec un lien vers Google Maps et
        un appel en un clic).
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
