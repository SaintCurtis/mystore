"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Drop this component anywhere in the admin layout.
 * It shows a one-time "Enable Alerts" button that requests push permission
 * and registers the subscription with your backend.
 *
 * Usage: import and place in app/(admin)/admin/layout.tsx
 *   <PushPermissionButton />
 */
export function PushPermissionButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") {
      setStatus("granted");
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  async function enablePush() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }

    setStatus("loading");

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error("Permission denied. Enable notifications in browser settings.");
        return;
      }

      // 2. Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("VAPID key not configured. Check NEXT_PUBLIC_VAPID_PUBLIC_KEY env var.");
        setStatus("idle");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      // 4. Send subscription to backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setStatus("granted");
      toast.success("🔔 Push alerts enabled! You'll be notified when bids get close.");
    } catch (err) {
      console.error("[push] Subscribe error:", err);
      setStatus("idle");
      toast.error("Could not enable push notifications. Try again.");
    }
  }

  async function disablePush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("idle");
      toast.success("Push alerts disabled.");
    } catch {
      toast.error("Could not disable push notifications.");
    }
  }

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <button
        onClick={disablePush}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        title="Click to disable push alerts"
      >
        <Bell className="h-3.5 w-3.5" />
        Alerts on
      </button>
    );
  }

  if (status === "denied") {
    return (
      <span
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
        title="Notifications blocked — change in browser settings"
      >
        <BellOff className="h-3.5 w-3.5" />
        Alerts blocked
      </span>
    );
  }

  return (
    <button
      onClick={enablePush}
      disabled={status === "loading"}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
      title="Get notified when a customer bids close to floor"
    >
      {status === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      {status === "loading" ? "Enabling…" : "Enable Alerts"}
    </button>
  );
}