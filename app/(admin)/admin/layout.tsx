"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Menu,
  X,
  ExternalLink,
  HandshakeIcon,
  Lock,
  Loader2,
} from "lucide-react";
import { Providers } from "@/components/providers/Providers";
import { WishlistStoreProvider } from "@/lib/store/wishlist-store-provider";
import { CompareStoreProvider } from "@/lib/store/compare-store-provider";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { CurrencyProvider } from "@/lib/store/currency-store-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Nav items ────────────────────────────────────────────────────────────
const navItems = [
  { label: "Dashboard",    href: "/admin",               icon: LayoutDashboard },
  { label: "Inventory",    href: "/admin/inventory",     icon: Package         },
  { label: "Orders",       href: "/admin/orders",        icon: ShoppingCart    },
  { label: "Negotiations", href: "/admin/negotiations",  icon: HandshakeIcon   },
];

// ── PIN Gate ─────────────────────────────────────────────────────────────
const SESSION_KEY = "admin_authed";
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 hours

function PinGate({ onAuth }: { onAuth: () => void }) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5) {
      const pin = [...next.slice(0, 5), value].join("");
      if (pin.length === 6) submit(pin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      submit(pasted);
    }
  };

  async function submit(pin: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        onAuth();
      } else {
        setError("Incorrect PIN. Try again.");
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>

        <h1 className="text-center text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Admin Access
        </h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          Enter your 6-digit PIN to continue
        </p>

        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={cn(
                "h-12 w-10 rounded-xl border text-center text-lg font-bold transition-all",
                "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
                "focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500",
                error
                  ? "border-red-400 dark:border-red-500"
                  : "border-zinc-200 dark:border-zinc-700",
                loading && "opacity-50"
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-500 dark:text-red-400 mb-4">
            {error}
          </p>
        )}

        <Button
          onClick={() => submit(digits.join(""))}
          disabled={digits.join("").length < 6 || loading}
          className="w-full h-11 bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 disabled:opacity-40"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…</>
          ) : (
            "Enter"
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-900",
      sidebarOpen ? "translate-x-0" : "-translate-x-full",
      "lg:translate-x-0",
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
              <span className="text-sm font-bold text-white dark:text-zinc-900">A</span>
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-zinc-200 px-3 py-4 dark:border-zinc-800">
          <Link
            href="/studio" target="_blank"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Open Studio
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="block px-3 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </aside>
  );
}

// ── Root layout ───────────────────────────────────────────────────────────
function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ts = sessionStorage.getItem(SESSION_KEY);
    if (ts && Date.now() - parseInt(ts) < SESSION_TTL) {
      setAuthed(true);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      setAuthed(false);
    }
  }, []);

  // Still checking session
  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Not authed — show PIN gate with NO providers (prevents Sanity auth redirect)
  if (!authed) {
    return <PinGate onAuth={() => setAuthed(true)} />;
  }

  // ── Authed — wrap with Providers so Sanity SDK hooks work
  return (
    <Providers>
      <CartStoreProvider>
        <WishlistStoreProvider>
          <CompareStoreProvider>
            <CurrencyProvider>
              <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">

                {/* Mobile header */}
                <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
                  <Link href="/admin" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                      <span className="text-sm font-bold text-white dark:text-zinc-900">A</span>
                    </div>
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Admin</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>

                {/* Mobile overlay */}
                {sidebarOpen && (
                  <button
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}

                <AdminSidebar
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />

                <main className="flex-1 pt-14 lg:ml-64 lg:pt-0">
                  <div className="p-4 lg:p-8">{children}</div>
                </main>
              </div>
            </CurrencyProvider>
          </CompareStoreProvider>
        </WishlistStoreProvider>
      </CartStoreProvider>
    </Providers>
  );
}

export default AdminLayout;