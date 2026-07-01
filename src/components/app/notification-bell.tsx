"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  TrendingUp,
  Gauge,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/notifications";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
};

const ICON: Record<string, typeof Bell> = {
  booking: CalendarCheck,
  recovery: TrendingUp,
  quota: Gauge,
  billing: CreditCard,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number; items: Item[] };
      setUnread(data.unread);
      setItems(data.items);
    } catch {
      // silencieux
    }
  }, []);

  // Chargement initial + rafraîchissement périodique.
  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function openItem(item: Item) {
    if (!item.readAt) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i,
        ),
      );
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(item.id).catch(() => {});
    }
    setOpen(false);
    if (item.url) router.push(item.url);
  }

  async function markAll() {
    setItems((prev) =>
      prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })),
    );
    setUnread(0);
    await markAllNotificationsRead().catch(() => {});
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="text-muted hover:bg-nude-soft hover:text-ink relative rounded-md p-2 transition-colors"
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="bg-lacquer absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-[var(--base)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="border-line bg-surface absolute right-0 z-50 mt-2 w-80 rounded-xl border shadow-[var(--shadow-card)]">
          <div className="border-line flex items-center justify-between border-b px-4 py-3">
            <span className="text-ink text-sm font-semibold">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                className="text-lacquer-ink text-xs font-medium hover:underline"
              >
                Tout marquer comme lu
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-muted px-4 py-8 text-center text-sm">
                Aucune notification pour le moment.
              </p>
            ) : (
              items.map((item) => {
                const Icon = ICON[item.type] ?? Bell;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      item.readAt ? "hover:bg-nude-soft/40" : "bg-nude-soft/50",
                    )}
                  >
                    <span className="bg-nude-soft text-lacquer-ink mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-ink block text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="text-muted block text-xs leading-snug">
                        {item.body}
                      </span>
                      <span className="text-muted/70 mt-0.5 block text-[11px]">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                    {!item.readAt ? (
                      <span className="bg-lacquer mt-1.5 size-2 shrink-0 rounded-full" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
