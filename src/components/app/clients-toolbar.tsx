"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CLIENT_STATUS, type ClientStatus } from "@/lib/client-status";

const STATUS_OPTIONS: { value: "" | ClientStatus; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  ...(
    ["dormant", "at_risk", "active", "recovered", "lost"] as ClientStatus[]
  ).map((s) => ({ value: s, label: CLIENT_STATUS[s].label })),
];

const SORT_OPTIONS = [
  { value: "recent", label: "Dernière visite" },
  { value: "name", label: "Nom (A → Z)" },
  { value: "visits", label: "Nombre de visites" },
  { value: "spend", label: "Panier moyen" },
];

const selectClass =
  "h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-lacquer focus-visible:ring-2 focus-visible:ring-lacquer/30";

export function ClientsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  // Recherche débouncée → met à jour l'URL.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      update("q", q);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une cliente (nom, téléphone, email)…"
          className="pl-9"
          aria-label="Rechercher une cliente"
        />
      </div>
      <select
        aria-label="Filtrer par statut"
        className={selectClass}
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Trier"
        className={selectClass}
        value={params.get("sort") ?? "recent"}
        onChange={(e) => update("sort", e.target.value)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
