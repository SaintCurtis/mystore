"use client";

import { Loader2, Mail, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  amountInWords,
  computeTotals,
  formatNaira,
} from "@/lib/receipts/money";
import {
  ITEM_CONDITION_LABELS,
  ITEM_CONDITIONS,
  type ItemCondition,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/receipts/types";
import { cn } from "@/lib/utils";
import {
  ApiError,
  type IssuePayload,
  type IssueResult,
  issueReceipt,
  type ProductHit,
  searchProducts,
} from "./api";

// ── helpers ────────────────────────────────────────────────────────────────

const SERVED_BY_KEY = "receipt_served_by";
const WARRANTY_CHIPS = ["3 months", "6 months", "1 year"];

const digitsOnly = (value: string) => value.replace(/\D/g, "");
const toInt = (value: string) => {
  const digits = digitsOnly(value).slice(0, 12);
  return digits ? parseInt(digits, 10) : 0;
};
const withCommas = (value: string) => {
  const digits = digitsOnly(value).slice(0, 12);
  return digits ? parseInt(digits, 10).toLocaleString("en-NG") : "";
};
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function conditionFromTitle(title: string | null): ItemCondition | "" {
  const t = (title ?? "").toLowerCase();
  if (!t) return "";
  if (t.includes("refurb")) return "refurbished";
  if (t.includes("used")) return "foreign_used";
  if (t.includes("new")) return "new";
  return "";
}

interface FormItem {
  key: string;
  description: string;
  serial: string;
  condition: ItemCondition | "";
  warranty: string;
  quantity: string;
  unitPrice: string;
}

const newItem = (): FormItem => ({
  key: uid(),
  description: "",
  serial: "",
  condition: "",
  warranty: "",
  quantity: "1",
  unitPrice: "",
});

// ── catalogue-aware description field ─────────────────────────────────────

function DescriptionField({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (product: ProductHit) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (!open || query.length < 2) {
      setHits([]);
      return;
    }
    const id = ++sequence.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchProducts(query);
        if (id === sequence.current) setHits(found);
      } catch {
        if (id === sequence.current) setHits([]);
      } finally {
        if (id === sequence.current) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value, open]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search your catalogue or type the item"
          maxLength={160}
          className="pl-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
        )}
      </div>

      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                // keep the input focused so blur doesn't close the list before the tap lands
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(hit);
                  setOpen(false);
                }}
                className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {hit.name}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {[
                      hit.condition,
                      hit.stock != null
                        ? hit.stock > 0
                          ? `${hit.stock} in stock`
                          : "Out of stock"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {hit.price != null && (
                  <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatNaira(hit.price)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── the form ───────────────────────────────────────────────────────────────

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const sectionTitle = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
const labelClass = "text-xs font-medium text-zinc-500 dark:text-zinc-400";

export function ReceiptForm({
  onIssued,
}: {
  onIssued: (result: IssueResult) => void;
}) {
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [items, setItems] = useState<FormItem[]>(() => [newItem()]);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [reference, setReference] = useState("");
  const [discount, setDiscount] = useState("");
  const [paidInFull, setPaidInFull] = useState(true);
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [servedBy, setServedBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<null | "issue" | "email">(null);

  // One id per distinct receipt. If the network drops and you tap again, the
  // server recognises the id and hands back the receipt it already made.
  const requestId = useRef<string | null>(null);
  const lastSignature = useRef<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SERVED_BY_KEY);
      if (saved) setServedBy(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const totals = useMemo(
    () =>
      computeTotals(
        items.map((item) => ({
          quantity: Math.max(1, toInt(item.quantity)),
          unitPrice: toInt(item.unitPrice),
        })),
        toInt(discount),
        paidInFull ? null : toInt(amountPaid),
      ),
    [items, discount, paidInFull, amountPaid],
  );

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim());
  const words = totals.total > 0 ? amountInWords(totals.total) : "";

  function updateItem(key: string, patch: Partial<FormItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function validate(): string | null {
    if (!customer.name.trim()) return "Enter the customer's name.";
    if (customer.email.trim() && !emailValid)
      return "That email address doesn't look right.";
    for (const [index, item] of items.entries()) {
      const label = items.length > 1 ? `Item ${index + 1}: ` : "";
      if (!item.description.trim()) return `${label}describe what was sold.`;
      if (toInt(item.quantity) < 1)
        return `${label}quantity must be at least 1.`;
      if (toInt(item.unitPrice) < 1) return `${label}enter the price.`;
    }
    if (toInt(discount) > totals.subtotal)
      return "The discount is more than the subtotal.";
    if (totals.total < 1) return "The total can't be zero.";
    if (!paidInFull && toInt(amountPaid) > totals.total)
      return "Amount paid is more than the total.";
    return null;
  }

  async function submit(sendEmail: boolean) {
    const problem = validate();
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    setError(null);

    const payload: Omit<IssuePayload, "clientRequestId" | "sendEmail"> = {
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim() || undefined,
        email: customer.email.trim() || undefined,
        address: customer.address.trim() || undefined,
      },
      items: items.map((item) => ({
        description: item.description.trim(),
        serial: item.serial.trim() || undefined,
        condition: item.condition || undefined,
        warranty: item.warranty.trim() || undefined,
        quantity: Math.max(1, toInt(item.quantity)),
        unitPrice: toInt(item.unitPrice),
      })),
      discount: toInt(discount),
      amountPaid: paidInFull ? undefined : toInt(amountPaid),
      paymentMethod: method,
      paymentReference: reference.trim() || undefined,
      servedBy: servedBy.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    // Same content as the last attempt => reuse the id (safe retry).
    // Edited since => it's a different receipt, so use a fresh id.
    const signature = JSON.stringify(payload);
    if (!requestId.current || signature !== lastSignature.current) {
      requestId.current = uid();
      lastSignature.current = signature;
    }

    setSubmitting(sendEmail ? "email" : "issue");
    try {
      const result = await issueReceipt({
        ...payload,
        clientRequestId: requestId.current,
        sendEmail: sendEmail && emailValid,
      });
      try {
        if (payload.servedBy)
          localStorage.setItem(SERVED_BY_KEY, payload.servedBy);
      } catch {
        /* storage unavailable */
      }
      onIssued(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not issue the receipt. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  }

  const busy = submitting !== null;

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[1fr_340px] lg:pb-0">
      <div className="space-y-6">
        {/* Customer */}
        <section className={card}>
          <h2 className={sectionTitle}>Customer</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rc-name" className={labelClass}>
                Full name
              </Label>
              <Input
                id="rc-name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                maxLength={80}
                placeholder="e.g. Ada Okonkwo"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-phone" className={labelClass}>
                Phone (optional)
              </Label>
              <Input
                id="rc-phone"
                type="tel"
                inputMode="tel"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                maxLength={30}
                placeholder="+234 803 000 0000"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-email" className={labelClass}>
                Email (to send the PDF)
              </Label>
              <Input
                id="rc-email"
                type="email"
                inputMode="email"
                value={customer.email}
                onChange={(e) =>
                  setCustomer({ ...customer, email: e.target.value })
                }
                maxLength={120}
                placeholder="customer@example.com"
                autoComplete="off"
                aria-invalid={customer.email.trim() !== "" && !emailValid}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rc-address" className={labelClass}>
                Address (optional)
              </Label>
              <Input
                id="rc-address"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                maxLength={200}
                placeholder="Street, area, city"
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        {/* Items */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className={sectionTitle}>Items sold</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {items.map((item, index) => {
              const lineTotal =
                Math.max(1, toInt(item.quantity)) * toInt(item.unitPrice);
              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setItems((c) => c.filter((i) => i.key !== item.key))
                        }
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200/60 hover:text-red-600 dark:hover:bg-zinc-800"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-6">
                    <div className="space-y-1.5 sm:col-span-6">
                      <Label className={labelClass}>Description</Label>
                      <DescriptionField
                        value={item.description}
                        onChange={(description) =>
                          updateItem(item.key, { description })
                        }
                        onPick={(product) =>
                          updateItem(item.key, {
                            description: product.name,
                            unitPrice:
                              product.price != null
                                ? String(product.price)
                                : item.unitPrice,
                            condition:
                              conditionFromTitle(product.condition) ||
                              item.condition,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-3">
                      <Label className={labelClass}>
                        Serial number / IMEI (optional)
                      </Label>
                      <Input
                        value={item.serial}
                        onChange={(e) =>
                          updateItem(item.key, { serial: e.target.value })
                        }
                        maxLength={80}
                        placeholder="Needed for warranty claims"
                        autoComplete="off"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-3">
                      <Label className={labelClass}>Condition</Label>
                      <Select
                        value={item.condition || "none"}
                        onValueChange={(v) =>
                          updateItem(item.key, {
                            condition: v === "none" ? "" : (v as ItemCondition),
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Not stated" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not stated</SelectItem>
                          {ITEM_CONDITIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {ITEM_CONDITION_LABELS[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-3">
                      <Label className={labelClass}>Warranty (optional)</Label>
                      <Input
                        value={item.warranty}
                        onChange={(e) =>
                          updateItem(item.key, { warranty: e.target.value })
                        }
                        maxLength={40}
                        placeholder="e.g. 6 months"
                        autoComplete="off"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {WARRANTY_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() =>
                              updateItem(item.key, { warranty: chip })
                            }
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                              item.warranty === chip
                                ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                                : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400",
                            )}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className={labelClass}>Qty</Label>
                      <Input
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.key, {
                            quantity: digitsOnly(e.target.value).slice(0, 3),
                          })
                        }
                        onBlur={() => {
                          if (toInt(item.quantity) < 1)
                            updateItem(item.key, { quantity: "1" });
                        }}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className={labelClass}>Unit price (₦)</Label>
                      <Input
                        inputMode="numeric"
                        value={withCommas(item.unitPrice)}
                        onChange={(e) =>
                          updateItem(item.key, {
                            unitPrice: digitsOnly(e.target.value).slice(0, 12),
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {lineTotal > 0 && (
                    <p className="mt-3 text-right text-xs text-zinc-500 dark:text-zinc-400">
                      Line total{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatNaira(lineTotal)}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            onClick={() => setItems((c) => [...c, newItem()])}
            disabled={items.length >= 30}
          >
            <Plus className="h-4 w-4" /> Add another item
          </Button>
        </section>

        {/* Payment */}
        <section className={card}>
          <h2 className={sectionTitle}>Payment</h2>

          <div className="mt-4 space-y-1.5">
            <Label className={labelClass}>How did the customer pay?</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                    method === m
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300",
                  )}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rc-ref" className={labelClass}>
                Payment reference (optional)
              </Label>
              <Input
                id="rc-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={80}
                placeholder="Transfer or POS reference"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-discount" className={labelClass}>
                Discount (₦, optional)
              </Label>
              <Input
                id="rc-discount"
                inputMode="numeric"
                value={withCommas(discount)}
                onChange={(e) =>
                  setDiscount(digitsOnly(e.target.value).slice(0, 12))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Paid in full
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Turn off to record a deposit or part payment.
              </p>
            </div>
            <Switch
              checked={paidInFull}
              onCheckedChange={setPaidInFull}
              aria-label="Paid in full"
            />
          </div>

          {!paidInFull && (
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="rc-paid" className={labelClass}>
                Amount paid today (₦)
              </Label>
              <Input
                id="rc-paid"
                inputMode="numeric"
                value={withCommas(amountPaid)}
                onChange={(e) =>
                  setAmountPaid(digitsOnly(e.target.value).slice(0, 12))
                }
                placeholder="0"
              />
              {totals.balance > 0 && (
                <p className="text-xs text-brand-700 dark:text-brand-400">
                  Balance still owed:{" "}
                  <strong>{formatNaira(totals.balance)}</strong>
                </p>
              )}
            </div>
          )}
        </section>

        {/* Notes */}
        <section className={card}>
          <h2 className={sectionTitle}>Notes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rc-notes" className={labelClass}>
                Printed on the receipt (optional)
              </Label>
              <Textarea
                id="rc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={400}
                rows={3}
                placeholder="e.g. Balance due by 30 November. Pickup arranged for Friday."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-served" className={labelClass}>
                Served by
              </Label>
              <Input
                id="rc-served"
                value={servedBy}
                onChange={(e) => setServedBy(e.target.value)}
                maxLength={60}
                placeholder="Your name"
                autoComplete="off"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Summary + actions */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <div className={card}>
            <h2 className={sectionTitle}>Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <dt>Subtotal</dt>
                <dd>{formatNaira(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <dt>Discount</dt>
                  <dd>-{formatNaira(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                <dt>Total</dt>
                <dd>{formatNaira(totals.total)}</dd>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <dt>Paid</dt>
                <dd>{formatNaira(totals.amountPaid)}</dd>
              </div>
              <div
                className={cn(
                  "flex justify-between rounded-lg px-2 py-1.5 font-semibold",
                  totals.balance > 0
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                <dt>Balance due</dt>
                <dd>{formatNaira(totals.balance)}</dd>
              </div>
            </dl>
            {words && (
              <p className="mt-3 text-xs italic text-zinc-500 dark:text-zinc-400">
                {words}
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full gap-2"
              size="lg"
              disabled={busy}
              onClick={() => submit(false)}
            >
              {submitting === "issue" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ReceiptText className="h-4 w-4" />
              )}
              Issue receipt
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              size="lg"
              disabled={busy || !emailValid}
              onClick={() => submit(true)}
            >
              {submitting === "email" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Issue &amp; email to customer
            </Button>
            {!emailValid && (
              <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                Add the customer&apos;s email to send the PDF straight away.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        {error && (
          <p
            role="alert"
            className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </p>
        )}
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {totals.balance > 0
                ? `Balance ${formatNaira(totals.balance)}`
                : "Total"}
            </p>
            <p className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatNaira(totals.total)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={busy || !emailValid}
            onClick={() => submit(true)}
            aria-label="Issue and email to customer"
          >
            {submitting === "email" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={busy}
            onClick={() => submit(false)}
          >
            {submitting === "issue" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ReceiptText className="h-4 w-4" />
            )}
            Issue receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
