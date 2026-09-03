"use client";

// app/(app)/profile/ProfileClient.tsx

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Phone, MapPin, Plus, Trash2, Star, Home, ArrowLeft,
  Package, CheckCircle, Truck, Gift, Sparkles, Heart,
  Wallet, Pencil, X, Bell, BellOff, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { useCurrency } from "@/lib/store/currency-store-provider";
import { useWishlistActions } from "@/lib/store/wishlist-store-provider";
import { LayawayPayButton } from "@/components/app/LayawayPayButton";
import { StackedProductImages } from "@/components/app/StackedProductImages";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/utils";
import { daysUntilNextBirthday, isBirthdayToday } from "@/lib/birthday";
import type { GadgetGoal } from "@/lib/gadget-goal";
import type { ORDERS_BY_USER_QUERY_RESULT } from "@/sanity.types";
import type { ProfileWishlistItem, LayawayPlanResult } from "./page";

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

type Tab = "overview" | "orders" | "wishlist" | "layaway" | "contact" | "addresses";
type ToggleValue = "enabled" | "disabled";

interface ProfileClientProps {
  clerkUser: { email: string; name: string };
  profile: {
    birthday: string | null;
    birthdayReminders: ToggleValue;
    birthdaySmsOptIn: ToggleValue;
    hasPhone: boolean;
  };
  wishlist: ProfileWishlistItem[];
  layawayPlans: LayawayPlanResult[];
  orders: ORDERS_BY_USER_QUERY_RESULT;
  gadgetGoal: GadgetGoal | null;
}

// ── Styles ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-colors";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatBirthdayDisplay(birthday: string): string {
  const [, mm, dd] = birthday.split("-").map(Number);
  return `${MONTH_NAMES[mm - 1]} ${dd}`;
}

function ageFromBirthday(birthday: string): number {
  const [yyyy, mm, dd] = birthday.split("-").map(Number);
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  let age = today.getFullYear() - yyyy;
  const hasHadBirthdayThisYear = currentMonth > mm || (currentMonth === mm && currentDay >= dd);
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

// ── Component ─────────────────────────────────────────────────────────────

export function ProfileClient({
  clerkUser,
  profile,
  wishlist: initialWishlist,
  layawayPlans,
  orders,
  gadgetGoal,
}: ProfileClientProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const { formatInCurrency } = useCurrency();

  // ── Contact / Addresses state (unchanged from before) ───────────────────
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [contactLoaded, setContactLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  function loadContactDataIfNeeded() {
    if (contactLoaded) return;
    setContactLoaded(true);
    fetch("/api/customer/addresses")
      .then((r) => r.json())
      .then((data) => {
        setAddresses(data.addresses ?? []);
        setPhones(data.phones ?? []);
      })
      .catch(() => {});
  }

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

  // ── Birthday & notification state ────────────────────────────────────────
  const [birthdayInput, setBirthdayInput] = useState(profile.birthday ?? "");
  const [editingBirthday, setEditingBirthday] = useState(!profile.birthday);
  const [emailReminders, setEmailReminders] = useState<ToggleValue>(profile.birthdayReminders);
  const [smsReminders, setSmsReminders] = useState<ToggleValue>(profile.birthdaySmsOptIn);
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [currentBirthday, setCurrentBirthday] = useState(profile.birthday);

  async function saveBirthdaySettings() {
    setSavingBirthday(true);
    try {
      const body: Record<string, string> = {
        birthdayReminders: emailReminders,
        birthdaySmsOptIn: smsReminders,
      };
      if (birthdayInput) body.birthday = birthdayInput;

      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (birthdayInput) setCurrentBirthday(birthdayInput);
      setEditingBirthday(false);
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save — try again");
    } finally {
      setSavingBirthday(false);
    }
  }

  // ── Wishlist state (server-sourced, with direct-API removal) ────────────
  const [wishlist, setWishlist] = useState(initialWishlist);
  const { removeItem: removeFromLocalWishlistStore } = useWishlistActions();

  async function removeFromWishlist(productId: string) {
    const previous = wishlist;
    setWishlist((w) => w.filter((item) => item._id !== productId));
    removeFromLocalWishlistStore(productId); // keep this device's local store consistent too

    try {
      const remainingIds = previous.filter((item) => item._id !== productId).map((item) => item._id);
      const res = await fetch("/api/customer/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: remainingIds }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
    } catch {
      setWishlist(previous); // revert on failure
      toast.error("Couldn't remove that item");
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const initials = (clerkUser.name || clerkUser.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const firstName = (clerkUser.name || "").split(" ")[0] || "there";

  const inTransitStatuses = new Set(["paid", "processing", "shipped"]);
  const inTransitOrders = orders.filter((o) => inTransitStatuses.has(o.status ?? "paid"));
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const activeLayawayPlans = layawayPlans.filter((p) => p.status !== "completed");
  const completedLayawayPlans = layawayPlans.filter((p) => p.status === "completed");

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode; onClick?: () => void }[] = [
    { id: "overview", label: "Overview", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: "orders", label: "Orders", icon: <Package className="h-3.5 w-3.5" /> },
    { id: "wishlist", label: "Wishlist", icon: <Heart className="h-3.5 w-3.5" /> },
    { id: "layaway", label: "Layaway", icon: <Wallet className="h-3.5 w-3.5" /> },
    { id: "contact", label: "Contact", icon: <Phone className="h-3.5 w-3.5" />, onClick: loadContactDataIfNeeded },
    { id: "addresses", label: "Addresses", icon: <MapPin className="h-3.5 w-3.5" />, onClick: loadContactDataIfNeeded },
  ];

  const toggleBtn = (
    current: ToggleValue,
    onSelect: (v: ToggleValue) => void,
    labelOn: string,
    labelOff: string,
    disabled?: boolean
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {(["enabled", "disabled"] as ToggleValue[]).map((v) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(v)}
          className={`rounded-lg border py-2 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            current === v
              ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
          }`}
        >
          {v === "enabled" ? labelOn : labelOff}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Home button — always visible, top of page */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors mb-6"
        >
          <Home className="h-4 w-4" /> Home
        </Link>

        {/* Profile header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/20">
            <span className="text-lg font-extrabold text-white">{initials || "?"}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1] truncate">
              {clerkUser.name || "My Profile"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-[#a3a3a3] truncate">{clerkUser.email}</p>
          </div>
          <Link
            href="/orders"
            className="ml-auto hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Full Order History
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto bg-white dark:bg-[#111111] p-1 rounded-xl border border-zinc-200 dark:border-[#1a1a1a] w-full sm:w-fit">
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                t.onClick?.();
              }}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tab === t.id
                  ? "bg-brand-500 text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════ Overview ══════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-4">

            {/* Birthday card */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-brand-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Birthday</p>
                </div>
                {currentBirthday && !editingBirthday && (
                  <button
                    onClick={() => setEditingBirthday(true)}
                    className="text-zinc-300 dark:text-zinc-600 hover:text-brand-500 transition-colors"
                    title="Edit birthday"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {!currentBirthday && !editingBirthday ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Add your birthday and we'll remember it every year. 🎂
                </p>
              ) : currentBirthday && !editingBirthday ? (
                isBirthdayToday(currentBirthday) ? (
                  <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                    🎉 Happy Birthday, {firstName}! Turning {ageFromBirthday(currentBirthday)} today.
                  </p>
                ) : daysUntilNextBirthday(currentBirthday) <= 14 ? (
                  <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
                    🎉 {daysUntilNextBirthday(currentBirthday)} days until your birthday —
                    turning {ageFromBirthday(currentBirthday) + 1}!
                  </p>
                ) : (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    🎂 Your birthday is <span className="font-semibold">{formatBirthdayDisplay(currentBirthday)}</span>
                  </p>
                )
              ) : null}

              {editingBirthday && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="date"
                    value={birthdayInput}
                    onChange={(e) => setBirthdayInput(e.target.value)}
                    className={inputClass}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                  {currentBirthday && (
                    <button
                      onClick={() => {
                        setEditingBirthday(false);
                        setBirthdayInput(currentBirthday);
                      }}
                      className="shrink-0 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Notification preferences */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Bell className="h-3 w-3" /> Birthday Email
                  </p>
                  {toggleBtn(emailReminders, setEmailReminders, "On", "Off")}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <BellOff className="h-3 w-3" /> Birthday SMS
                  </p>
                  {toggleBtn(smsReminders, setSmsReminders, "On", "Off", !profile.hasPhone)}
                  {!profile.hasPhone && (
                    <p className="text-[10px] text-zinc-400 mt-1.5">Add a phone number in Contact to enable SMS.</p>
                  )}
                </div>
              </div>

              <Button
                onClick={saveBirthdaySettings}
                disabled={savingBirthday || (editingBirthday && !birthdayInput)}
                className="mt-4 w-full bg-brand-500 hover:bg-brand-400 text-white font-bold"
              >
                {savingBirthday ? "Saving..." : "Save"}
              </Button>
            </div>

            {/* Gadget Goal card */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Gadget Goal</p>
              </div>

              {!gadgetGoal ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Browse a few products or add something to your wishlist and we'll spot your next gadget goal here. ✨
                </p>
              ) : gadgetGoal.kind === "wishlist" ? (
                <Link
                  href={`/products/${gadgetGoal.product.slug}`}
                  className="flex items-center gap-3 group"
                >
                  {gadgetGoal.product.image && (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Image src={gadgetGoal.product.image} alt={gadgetGoal.product.name} fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] truncate group-hover:text-brand-500 transition-colors">
                      {gadgetGoal.product.name}
                    </p>
                    <p className="text-sm text-brand-500 font-semibold">{formatInCurrency(gadgetGoal.product.price ?? 0)}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                </Link>
              ) : (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  You've been searching for <span className="font-semibold">{gadgetGoal.term}</span> —
                  we've got you. Have a look around when you're ready.
                </p>
              )}
            </div>

            {/* At a glance */}
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setTab("orders")} className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4 text-center hover:border-brand-500/30 transition-colors">
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-[#f1f1f1]">{orders.length}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mt-1">Orders</p>
              </button>
              <button onClick={() => setTab("wishlist")} className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4 text-center hover:border-brand-500/30 transition-colors">
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-[#f1f1f1]">{wishlist.length}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mt-1">Wishlist</p>
              </button>
              <button onClick={() => setTab("layaway")} className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4 text-center hover:border-brand-500/30 transition-colors">
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-[#f1f1f1]">{activeLayawayPlans.length}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mt-1">Layaway</p>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════ Orders ══════════════════════ */}
        {tab === "orders" && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No orders yet"
                description="When you place an order, it will appear here."
                action={{ label: "Start Shopping", href: "/" }}
              />
            ) : (
              <>
                <OrderSection title="In Transit" icon={Truck} orders={inTransitOrders} emptyText="Nothing in transit right now." />
                <OrderSection title="Delivered" icon={CheckCircle} orders={deliveredOrders} emptyText="Nothing delivered yet." />
                {cancelledOrders.length > 0 && (
                  <OrderSection title="Cancelled" icon={X} orders={cancelledOrders} emptyText="" />
                )}
                <Link
                  href="/orders"
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline py-2"
                >
                  View full order history
                </Link>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════ Wishlist ══════════════════════ */}
        {tab === "wishlist" && (
          <div className="space-y-3">
            {wishlist.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="Your wishlist is empty"
                description="Tap the heart icon on any product to save it here."
                action={{ label: "Browse Products", href: "/" }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {wishlist.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden group"
                  >
                    <Link href={`/products/${item.slug}`} className="block relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="200px" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-8 w-8 text-zinc-300" />
                        </div>
                      )}
                      {(item.stock ?? 0) === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wide">Out of Stock</span>
                        </div>
                      )}
                    </Link>
                    <div className="p-3">
                      <Link href={`/products/${item.slug}`}>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-[#f1f1f1] line-clamp-2 mb-1 hover:text-brand-500 transition-colors">
                          {item.name}
                        </p>
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-500">{formatInCurrency(item.price ?? 0)}</span>
                        <button
                          onClick={() => removeFromWishlist(item._id)}
                          className="p-1 text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ Layaway ══════════════════════ */}
        {tab === "layaway" && (
          <div className="space-y-4">
            {layawayPlans.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No layaway plans yet"
                description="Start one from any product page — zero interest, pay at your own pace."
                action={{ label: "Browse Products", href: "/" }}
              />
            ) : (
              <>
                {[...activeLayawayPlans, ...completedLayawayPlans].map((plan) => {
                  const pct = plan.totalAmount ? Math.min(Math.round((plan.amountPaid / plan.totalAmount) * 100), 100) : 0;
                  const remaining = Math.max(plan.totalAmount - plan.amountPaid, 0);
                  const lockDaysLeft = plan.priceLockExpiresAt
                    ? Math.ceil((new Date(plan.priceLockExpiresAt).getTime() - Date.now()) / 86_400_000)
                    : null;

                  return (
                    <div key={plan._id} className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
                      <div className="flex items-start gap-3 mb-3">
                        {plan.product?.image && (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <Image src={plan.product.image} alt={plan.product.name} fill className="object-cover" sizes="56px" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-zinc-900 dark:text-[#f1f1f1] truncate">
                            {plan.product?.name ?? plan.planNumber}
                          </p>
                          <p className="text-xs text-zinc-400">{plan.planNumber}</p>
                        </div>
                        <Badge className={plan.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-brand-100 text-brand-800"}>
                          {plan.status === "completed" ? "Fully Paid" : plan.status === "reserved" ? "Reserved" : "Active"}
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs mb-4">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatInCurrency(plan.amountPaid)}</span> of {formatInCurrency(plan.totalAmount)} ({pct}%)
                        </span>
                        {plan.status !== "completed" && (
                          <span className="font-semibold text-brand-500">{formatInCurrency(remaining)} left</span>
                        )}
                      </div>

                      {plan.status === "completed" ? (
                        plan.resultingOrderId && (
                          <Link
                            href={`/orders/${plan.resultingOrderId}`}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" /> View your order
                          </Link>
                        )
                      ) : (
                        <>
                          <LayawayPayButton
                            mode="topup"
                            planId={plan._id}
                            suggestedAmount={remaining}
                            maxAmount={remaining}
                            buttonLabel="Add a payment"
                          />
                          {lockDaysLeft !== null && lockDaysLeft <= 14 && lockDaysLeft > 0 && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 text-center">
                              Price lock expires in {lockDaysLeft} day{lockDaysLeft === 1 ? "" : "s"}
                            </p>
                          )}
                        </>
                      )}

                      {plan.payments.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-[11px] font-semibold text-zinc-400 cursor-pointer">
                            Payment history ({plan.payments.length})
                          </summary>
                          <div className="mt-2 space-y-1.5">
                            {plan.payments.map((pmt, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                <span>{formatDate(pmt.paidAt, "short")}</span>
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatInCurrency(pmt.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════ Contact ══════════════════════ */}
        {tab === "contact" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Email Address</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#1a1a1a]">
                  <span className="text-xs font-bold text-zinc-500">@</span>
                </div>
                <span className="text-sm text-zinc-900 dark:text-[#f1f1f1] flex-1">{clerkUser.email}</span>
                <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full uppercase tracking-wide">
                  via Clerk
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                To change your email address, use your account settings.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Phone Numbers</p>

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
                      <Phone className="h-4 w-4 text-brand-500 shrink-0" />
                      <span className="text-sm text-zinc-900 dark:text-[#f1f1f1] flex-1">{phone}</span>
                      {i === 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          <CheckCircle className="h-2.5 w-2.5" /> Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

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
                  className="shrink-0 bg-brand-500 hover:bg-brand-400 text-white font-bold"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
                Your phone number helps us contact you about your orders — and unlocks birthday SMS.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════ Addresses ══════════════════════ */}
        {tab === "addresses" && (
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
                <MapPin className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No saved addresses yet</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1 max-w-xs mx-auto">
                  Your delivery address is saved automatically after your first order — it will appear here.
                </p>
                <Link
                  href="/"
                  className="inline-flex mt-4 rounded-lg bg-brand-500 hover:bg-brand-400 px-5 py-2 text-sm font-bold text-white transition-colors"
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
                      ? "border-brand-200 dark:border-brand-500/20"
                      : "border-zinc-200 dark:border-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {addr.isDefault && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />}
                      <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f1f1]">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
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

// ── Sub-components ───────────────────────────────────────────────────────

function OrderSection({
  title,
  icon: Icon,
  orders,
  emptyText,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  orders: ORDERS_BY_USER_QUERY_RESULT;
  emptyText: string;
}) {
  if (orders.length === 0 && !emptyText) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-brand-500" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</p>
        <span className="text-xs text-zinc-400">({orders.length})</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-2">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = getOrderStatus(order.status);
            const StatusIcon = status.icon;
            const images = (order.itemImages ?? []).filter((url): url is string => url !== null);

            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="group block rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] transition-all hover:border-zinc-300 dark:hover:border-brand-500/20"
              >
                <div className="flex gap-4 p-4">
                  <StackedProductImages images={images} totalCount={order.itemCount ?? 0} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-[#f1f1f1]">
                          Order #{formatOrderNumber(order.orderNumber)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-[#a3a3a3]">{formatDate(order.createdAt)}</p>
                      </div>
                      <Badge className={`${status.color} shrink-0 flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-brand-400">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
