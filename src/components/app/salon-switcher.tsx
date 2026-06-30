"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Store } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { setActiveSalon, createSalon } from "@/server/salons";
import type { AccessibleSalon } from "@/lib/auth";

export function SalonSwitcher({
  salons,
  activeSalonId,
  canAddSalon,
}: {
  salons: AccessibleSalon[];
  activeSalonId: string;
  canAddSalon: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  const active = salons.find((s) => s.id === activeSalonId);
  const single = salons.length <= 1;

  function choose(id: string) {
    if (id === activeSalonId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await setActiveSalon(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await createSalon(newName.trim());
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Salon créé.");
      setAdding(false);
      setNewName("");
      setOpen(false);
      router.refresh();
    });
  }

  // Un seul salon et impossible d'en ajouter : on affiche juste le nom.
  if (single && !canAddSalon) {
    return (
      <p className="font-display text-ink truncate font-semibold">
        {active?.name ?? "Mon salon"}
      </p>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="hover:bg-nude-soft -ml-2 flex max-w-[60vw] items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
      >
        <span className="font-display text-ink truncate font-semibold">
          {active?.name ?? "Mon salon"}
        </span>
        <ChevronsUpDown className="text-muted size-4 shrink-0" />
      </button>

      {open ? (
        <>
          <button
            aria-label="Fermer"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => {
              setOpen(false);
              setAdding(false);
            }}
          />
          <div className="border-line bg-surface absolute left-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border shadow-[var(--shadow-card)]">
            <div className="max-h-72 overflow-y-auto p-1">
              {salons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => choose(s.id)}
                  disabled={isPending}
                  className="hover:bg-nude-soft flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors"
                >
                  <Store className="text-muted size-4 shrink-0" />
                  <span className="text-ink min-w-0 flex-1 truncate">
                    {s.name}
                  </span>
                  {s.id === activeSalonId ? (
                    <Check className="text-lacquer size-4 shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>

            {canAddSalon ? (
              <div className="border-line border-t p-1">
                {adding ? (
                  <form onSubmit={add} className="flex items-center gap-1.5 p-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nom du nouveau salon"
                      className="border-line bg-base text-ink h-8 min-w-0 flex-1 rounded-md border px-2 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="bg-lacquer rounded-md px-2.5 py-1.5 text-xs font-medium text-white"
                    >
                      Créer
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="text-lacquer-ink hover:bg-nude-soft flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors"
                  >
                    <Plus className="size-4 shrink-0" />
                    Ajouter un salon
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
