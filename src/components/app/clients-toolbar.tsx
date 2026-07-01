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

const REACHABLE_OPTIONS = [
  { value: "", label: "Joignables : toutes" },
  { value: "sms", label: "Joignables par SMS" },
  { value: "email", label: "Joignables par email" },
];

const LOYALTY_OPTIONS = [
  { value: "", label: "Fidélité : toutes" },
  { value: "new", label: "Nouvelles (≤ 1 visite)" },
  { value: "loyal", label: "Fidèles (≥ 3 visites)" },
];

const SPEND_OPTIONS = [
  { value: "", label: "Panier : tous" },
  { value: "30", label: "Panier ≥ 30 €" },
  { value: "50", label: "Panier ≥ 50 €" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Dernière visite" },
  { value: "name", label: "Nom (A → Z)" },
  { value: "visits", label: "Nombre de visites" },
  { value: "spend", label: "Panier moyen" },
];

const FILTER_KEYS = ["q", "status", "reachable", "loyalty", "spend"];

const selectClass =
  "h-11 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-lacquer focus-visible:ring-2 focus-visible:ring-lacquer/30";

export function ClientsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  const anyFilter = FILTER_KEYS.some((k) => params.get(k));

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

  function reset() {
    const next = new URLSearchParams();
    const sort = params.get("sort");
    if (sort) next.set("sort", sort);
    setQ("");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un client (nom, téléphone, email)…"
          className="pl-9"
          aria-label="Rechercher un client"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
          aria-label="Filtrer par joignabilité"
          className={selectClass}
          value={params.get("reachable") ?? ""}
          onChange={(e) => update("reachable", e.target.value)}
        >
          {REACHABLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par fidélité"
          className={selectClass}
          value={params.get("loyalty") ?? ""}
          onChange={(e) => update("loyalty", e.target.value)}
        >
          {LOYALTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrer par panier moyen"
          className={selectClass}
          value={params.get("spend") ?? ""}
          onChange={(e) => update("spend", e.target.value)}
        >
          {SPEND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="text-muted hidden flex-1 sm:block" />

        <select
          aria-label="Trier"
          className={selectClass}
          value={params.get("sort") ?? "recent"}
          onChange={(e) => update("sort", e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Trier : {o.label}
            </option>
          ))}
        </select>

        {anyFilter ? (
          <button
            type="button"
            onClick={reset}
            className="text-lacquer-ink hover:bg-nude-soft rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            Réinitialiser
          </button>
        ) : null}
      </div>
    </div>
  );
}
