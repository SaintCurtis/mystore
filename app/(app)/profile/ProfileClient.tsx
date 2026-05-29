"use client";

// app/(app)/profile/ProfileClient.tsx

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone, MapPin, Plus, Trash2, Star, ArrowLeft,
  Package, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────

interface SavedAddress {
  _key: string;
  label: string;
  isDefault: boolean;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  lga: string;
  postcode: string;
  country: string;
  countryCode: string;
}

type Tab = "contact" | "addresses";

// ── Styles ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";

// ── Component ─────────────────────────────────────────────────────────────

export function ProfileClient({
  clerkUser,
}: {
  clerkUser: { email: string; name: string };
}) {
  const [tab, setTab] = useState<Tab>("contact");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customer/addresses")
      .then((r) => r.json())
      .then((data) => {
        setAddresses(data.addresses ?? []);
        setPhones(data.phones ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function addPhone() {
    const trimmed = newPhone.trim();
    if (!trimmed) return;
    if (phones.includes(trimmed)) {
      toast.error("That number is already saved");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed, saveAddress: false, address: {} }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setPhones((p) => [...p, trimmed]);
      setNewPhone("");
      toast.success("Phone number saved");
    } catch {
      toast.error("Failed to save phone number");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(key: string) {
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setAddresses((a) => a.filter((x) => x._key !== key));
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    }
  }

  const initials = (clerkUser.name || clerkUser.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const tabBtn = (t: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
        tab === t
          ? "bg-amber-500 text-zinc-950"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> My Orders
        </Link>

        {/* Profile header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/20">
            <span className="text-lg font-extrabold text-zinc-950">{initials || "?"}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
              {clerkUser.name || "My Profile"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">{clerkUser.email}</p>
          </div>
          <Link
            href="/orders"
            className="ml-auto hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <Package className="h-4 w-4" /> My Orders
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-white dark:bg-[#111111] p-1 rounded-xl border border-zinc-200 dark:border-[#1a1a1a] w-fit">
          {tabBtn("contact", "Contact", <Phone className="h-3.5 w-3.5" />)}
          {tabBtn("addresses", "Addresses", <MapPin className="h-3.5 w-3.5" />)}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : tab === "contact" ? (
          /* ── Contact Tab ── */
          <div className="space-y-4">

            {/* Email — read-only from Clerk */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Email Address
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a]">
                  <span className="text-xs font-bold text-zinc-500">@</span>
                </div>
                <span className="text-sm text-zinc-900 dark:text-[#f1f1f1] flex-1">
                  {clerkUser.email}
                </span>
                <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full uppercase tracking-wide">
                  via Clerk
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                To change your email address, use your account settings.
              </p>
            </div>

            {/* Phone numbers */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                Phone Numbers
              </p>

              {phones.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 py-2 mb-3">
                  No phone numbers saved yet. Add one below.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {phones.map((phone, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-[#1a1a1a] bg-zinc-50 dark:bg-[#0d0d0d] px-3 py-2.5"
                    >
                      <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm text-zinc-900 dark:text-[#f1f1f1] flex-1">
                        {phone}
                      </span>
                      {i === 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          <CheckCircle className="h-2.5 w-2.5" /> Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add phone */}
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPhone()}
                  placeholder="+234 800 000 0000"
                  className={inputClass}
                />
                <Button
                  onClick={addPhone}
                  disabled={saving || !newPhone.trim()}
                  className="shrink-0 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                Your phone number helps us contact you about your orders.
              </p>
            </div>
          </div>
        ) : (
          /* ── Addresses Tab ── */
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
                <MapPin className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  No saved addresses yet
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1 max-w-xs mx-auto">
                  Your delivery address is saved automatically after your first order — it will appear here.
                </p>
                <Link
                  href="/"
                  className="inline-flex mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 px-5 py-2 text-sm font-bold text-zinc-950 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr._key}
                  className={`rounded-xl border bg-white dark:bg-[#111111] p-4 transition-colors ${
                    addr.isDefault
                      ? "border-amber-200 dark:border-amber-500/20"
                      : "border-zinc-200 dark:border-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {addr.isDefault && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
                      )}
                      <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteAddress(addr._key)}
                      className="p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                      title="Remove address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <p className="font-medium text-zinc-800 dark:text-zinc-300">{addr.name}</p>
                    <p>
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                    </p>
                    {addr.lga && <p>{addr.lga} LGA</p>}
                    <p>
                      {addr.city}
                      {addr.state ? `, ${addr.state}` : ""}
                      {addr.postcode ? ` ${addr.postcode}` : ""}
                    </p>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs">{addr.country}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}