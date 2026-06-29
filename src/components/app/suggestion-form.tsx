"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { submitSuggestion } from "@/server/suggestions";
import type { SuggestionCategory } from "@/lib/validations/suggestion";

const CATEGORIES: { value: SuggestionCategory; label: string }[] = [
  { value: "question", label: "Une question" },
  { value: "idea", label: "Une idée" },
  { value: "problem", label: "Un souci" },
];

export function SuggestionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<SuggestionCategory>("idea");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitSuggestion({ category, message });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMessage("");
      setCategory("idea");
      toast.success("Merci ! Votre message nous a bien été transmis.");
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
        <Label>De quoi s'agit-il ?</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                category === c.value
                  ? "border-lacquer bg-lacquer text-[var(--base)]"
                  : "border-line text-muted hover:bg-nude-soft",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="suggestion-message">Votre message</Label>
        <Textarea
          id="suggestion-message"
          className="min-h-28"
          placeholder="Dites-nous tout : ce qui vous aiderait, ce qui manque, ce qui coince…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Button
        onClick={submit}
        disabled={isPending || message.trim().length < 3}
      >
        <Send className="size-4" />
        {isPending ? "Envoi…" : "Envoyer"}
      </Button>
    </div>
  );
}
