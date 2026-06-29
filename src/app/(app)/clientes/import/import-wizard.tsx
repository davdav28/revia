"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importClients, type ImportSummary } from "@/server/clients";
import type { ImportRow } from "@/lib/validations/client";
import { toast } from "@/components/ui/toaster";

type Field = {
  key: keyof ImportRow;
  label: string;
  required?: boolean;
  synonyms: string[];
};

const FIELDS: Field[] = [
  {
    key: "firstName",
    label: "Prénom",
    required: true,
    synonyms: ["prenom", "firstname", "first name", "first"],
  },
  {
    key: "lastName",
    label: "Nom",
    synonyms: ["nom", "lastname", "last name", "nom de famille", "famille"],
  },
  {
    key: "phone",
    label: "Téléphone",
    synonyms: [
      "telephone",
      "tel",
      "phone",
      "mobile",
      "portable",
      "gsm",
      "numero",
    ],
  },
  {
    key: "email",
    label: "Email",
    synonyms: ["email", "e-mail", "mail", "courriel"],
  },
  {
    key: "lastVisit",
    label: "Dernière visite",
    synonyms: [
      "derniere visite",
      "last visit",
      "dernier rdv",
      "dernier passage",
      "date",
    ],
  },
  {
    key: "amount",
    label: "Montant",
    synonyms: ["montant", "prix", "amount", "panier", "total", "ca"],
  },
];

const IGNORE = "__ignore__";

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function autoMap(headers: string[]): Record<string, string> {
  const used = new Set<string>();
  const map: Record<string, string> = {};
  const normed = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const field of FIELDS) {
    const hit =
      normed.find((h) => !used.has(h.raw) && field.synonyms.includes(h.n)) ??
      normed.find(
        (h) => !used.has(h.raw) && field.synonyms.some((s) => h.n.includes(s)),
      );
    if (hit) {
      map[field.key] = hit.raw;
      used.add(hit.raw);
    } else {
      map[field.key] = IGNORE;
    }
  }
  return map;
}

type Parsed = { headers: string[]; rows: Record<string, string>[] };

export function ImportWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const headers = (res.meta.fields ?? []).filter(Boolean);
        const rows = (res.data as Record<string, string>[]).filter((r) =>
          Object.values(r).some((v) => (v ?? "").toString().trim() !== ""),
        );
        if (headers.length === 0 || rows.length === 0) {
          setParseError(
            "Ce fichier semble vide ou sans en-têtes de colonnes. Vérifiez qu'il s'agit bien d'un CSV avec une première ligne de titres.",
          );
          setParsed(null);
          return;
        }
        setParsed({ headers, rows });
        setMapping(autoMap(headers));
        setFileName(file.name);
      },
      error: () => {
        setParseError("Impossible de lire ce fichier. Est-ce bien un CSV ?");
        setParsed(null);
      },
    });
  }

  function mapRows(): ImportRow[] {
    if (!parsed) return [];
    return parsed.rows.map((r) => {
      const out: ImportRow = {};
      for (const field of FIELDS) {
        const col = mapping[field.key];
        if (col && col !== IGNORE) {
          out[field.key] = (r[col] ?? "").toString().trim();
        }
      }
      return out;
    });
  }

  function confirmImport() {
    const rows = mapRows();
    startTransition(async () => {
      const summary = await importClients(rows);
      setResult(summary);
      if (summary.created > 0) {
        toast.success(
          `${summary.created} cliente${summary.created > 1 ? "s" : ""} importée${summary.created > 1 ? "s" : ""}.`,
        );
        router.refresh();
      }
    });
  }

  // --- Écran résultat ---
  if (result) {
    return (
      <Card>
        <CardContent className="space-y-5 pt-6 text-center">
          <div className="bg-status-active/10 text-status-active mx-auto flex size-12 items-center justify-center rounded-full">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="font-display text-ink text-lg font-semibold">
              Import terminé
            </p>
            <p className="text-muted mt-1 text-sm">
              {result.created} importée{result.created > 1 ? "s" : ""}
              {result.duplicates > 0 &&
                ` · ${result.duplicates} doublon${result.duplicates > 1 ? "s" : ""} ignoré${result.duplicates > 1 ? "s" : ""}`}
              {result.skipped > 0 &&
                ` · ${result.skipped} ligne${result.skipped > 1 ? "s" : ""} sans prénom ignorée${result.skipped > 1 ? "s" : ""}`}
            </p>
          </div>

          {result.warnings.length > 0 ? (
            <div className="border-status-at-risk/30 bg-status-at-risk/10 text-status-at-risk rounded-md border px-4 py-3 text-left text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="size-4" />
                {result.warnings.length} avertissement
                {result.warnings.length > 1 ? "s" : ""}
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-xs">
                {result.warnings.slice(0, 8).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {result.warnings.length > 8 ? (
                  <li>… et {result.warnings.length - 8} de plus.</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <Button asChild>
            <Link href="/clientes">Voir mes clientes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Étape upload ---
  if (!parsed) {
    return (
      <Card>
        <CardContent className="pt-6">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border-line bg-nude-soft/30 hover:bg-nude-soft/60 flex w-full flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors"
          >
            <span className="bg-nude-soft text-lacquer-ink flex size-12 items-center justify-center rounded-full">
              <UploadCloud className="size-6" />
            </span>
            <span className="text-ink font-medium">Choisir un fichier CSV</span>
            <span className="text-muted max-w-sm text-sm">
              Exportez votre fichier clientes depuis votre logiciel de caisse ou
              un tableur, au format CSV. Une première ligne d'en-têtes est
              attendue (Prénom, Nom, Téléphone…).
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {parseError ? (
            <p
              role="alert"
              className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant mt-4 rounded-md border px-3 py-2 text-sm"
            >
              {parseError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  // --- Étape mapping + aperçu ---
  const mapped = mapRows();
  const previewable = FIELDS.filter((f) => mapping[f.key] !== IGNORE);
  const firstNameOk = mapping.firstName !== IGNORE;
  const usableRows = mapped.filter((r) => (r.firstName ?? "").trim() !== "");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink font-medium">Associez vos colonnes</p>
              <p className="text-muted text-sm">
                {fileName} · {parsed.rows.length} ligne
                {parsed.rows.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setParsed(null);
                setFileName("");
              }}
            >
              Changer de fichier
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-ink block text-sm font-medium">
                  {field.label}
                  {field.required ? (
                    <span className="text-lacquer-ink"> *</span>
                  ) : null}
                </label>
                <select
                  value={mapping[field.key] ?? IGNORE}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                  }
                  className="border-line bg-surface text-ink focus-visible:border-lacquer focus-visible:ring-lacquer/30 h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                >
                  <option value={IGNORE}>— Ignorer —</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {!firstNameOk ? (
            <p className="border-status-dormant/30 bg-status-dormant/10 text-status-dormant rounded-md border px-3 py-2 text-sm">
              Associez au moins la colonne <strong>Prénom</strong> pour
              continuer.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {firstNameOk ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-ink font-medium">
              Aperçu ({usableRows.length} cliente
              {usableRows.length > 1 ? "s" : ""} à importer)
            </p>
            <div className="border-line overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewable.map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapped.slice(0, 8).map((r, i) => (
                    <TableRow key={i}>
                      {previewable.map((f) => (
                        <TableCell key={f.key} className="text-muted">
                          {r[f.key] || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {mapped.length > 8 ? (
              <p className="text-muted text-xs">
                … et {mapped.length - 8} autre{mapped.length - 8 > 1 ? "s" : ""}{" "}
                ligne{mapped.length - 8 > 1 ? "s" : ""}.
              </p>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={confirmImport}
                disabled={isPending || usableRows.length === 0}
              >
                {isPending
                  ? "Import en cours…"
                  : `Importer ${usableRows.length} cliente${usableRows.length > 1 ? "s" : ""}`}
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/clientes">Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
