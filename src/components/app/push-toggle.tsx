"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/server/push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "loading" | "unsupported" | "off" | "on" | "denied";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID_PUBLIC
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setState("on");
      toast.success("Notifications activées sur cet appareil.");
    } catch {
      toast.error("Impossible d'activer les notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
      toast.success("Notifications désactivées sur cet appareil.");
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return <div className="bg-nude-soft/50 h-11 w-48 animate-pulse rounded-md" />;
  }

  if (state === "unsupported") {
    return (
      <p className="text-muted text-sm">
        Les notifications push ne sont pas disponibles sur ce navigateur. Sur
        iPhone, ajoutez d'abord Revia à votre écran d'accueil.
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-muted text-sm">
        Les notifications sont bloquées pour ce site. Autorisez-les dans les
        réglages de votre navigateur pour les recevoir.
      </p>
    );
  }

  if (state === "on") {
    return (
      <div className="flex flex-col items-start gap-2">
        <span className="text-status-active inline-flex items-center gap-1.5 text-sm font-medium">
          <Check className="size-4" /> Activées sur cet appareil
        </span>
        <Button variant="ghost" size="sm" onClick={disable} disabled={busy}>
          <BellOff className="size-4" /> Désactiver
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={enable} disabled={busy}>
      <BellRing className="size-4" />
      {busy ? "Activation…" : "Activer les notifications"}
    </Button>
  );
}
