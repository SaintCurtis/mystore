"use client";

// app/(app)/quotation/QuotationClient.tsx

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText, Plus, Trash2, Sparkles, ArrowLeft, Printer,
  CheckCircle, Search, X, Mail, Send, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

// ── Types ─────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  fromCatalogue: boolean;
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

interface GeneratedQuote {
  quoteNumber: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  quoteDate: string;
  validUntil: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    notes: string;
  }[];
  subtotal: number;
  vatAmount?: number;
  vatNote: string;
  grandTotal: number;
  terms: string[];
  engineerNote: string;
}

// ── Styles ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-colors";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

// ── Product Search Input ──────────────────────────────────────────────────

function ProductSearchInput({
  value,
  onChange,
  onSelectProduct,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectProduct: (product: ProductSuggestion) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`)
      .then((r) => r.json())
      .then((data) => {
        const products: ProductSuggestion[] = (data?.results ?? []).map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price ?? 0,
          imageUrl: p.image,
          category: p.categoryTitle,
        }));
        setSuggestions(products);
        setOpen(products.length > 0);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleSelect(product: ProductSuggestion) {
    onSelectProduct(product);
    setSuggestions([]);
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Search products or type custom item…"}
          className={inputClass + " pl-9 pr-8"}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {searching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 animate-pulse">
            …
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] shadow-xl dark:shadow-black/40 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-[#1a1a1a]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              From your catalogue — select to auto-fill price
            </p>
          </div>
          <ul className="max-h-64 overflow-y-auto overscroll-contain">
            {suggestions.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-white/4 transition-colors text-left"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-9 w-9 rounded-lg object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-[#f1f1f1] truncate">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-zinc-400 truncate capitalize">{product.category}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400 shrink-0">
                    {formatPrice(product.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 py-2 border-t border-zinc-100 dark:border-[#1a1a1a]">
            <p className="text-[10px] text-zinc-400">
              Not listed? Keep typing to use a custom description.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Email Modal ───────────────────────────────────────────────────────────

function EmailModal({
  open,
  defaultEmail,
  onClose,
  onSend,
  sending,
}: {
  open: boolean;
  defaultEmail: string;
  onClose: () => void;
  onSend: (email: string) => void;
  sending: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);

  useEffect(() => { setEmail(defaultEmail); }, [defaultEmail]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 shrink-0">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-[#f1f1f1]">Email this quotation</h3>
            <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">We'll send a copy to your inbox</p>
          </div>
        </div>
        <label htmlFor="quotation-email" className={labelClass}>Email address</label>
        <input
          id="quotation-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
          onKeyDown={(e) => e.key === "Enter" && email.includes("@") && onSend(email)}
          autoFocus
        />
        <Button
          onClick={() => onSend(email)}
          disabled={sending || !email.includes("@")}
          className="w-full mt-4 bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2"
        >
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send Quotation</>}
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function QuotationClient() {
  const { user, isSignedIn } = useUser();
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", name: "", quantity: 1, unitPrice: 0, fromCatalogue: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<GeneratedQuote | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Pre-fill name from Clerk
  useEffect(() => {
    if (user?.fullName && !customerName) setCustomerName(user.fullName);
  }, [user]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", quantity: 1, unitPrice: 0, fromCatalogue: false },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof Omit<QuoteItem, "id">, value: string | number | boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function selectProductForItem(id: string, product: ProductSuggestion) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, name: product.name, unitPrice: product.price, fromCatalogue: true }
          : i
      )
    );
  }

  async function generateQuote() {
    const validItems = items.filter((i) => i.name.trim() && i.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one item with a name and unit price");
      return;
    }
    setLoading(true);
    setQuote(null);
    try {
      const res = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems.map(({ name, quantity, unitPrice }) => ({ name, quantity, unitPrice })),
          customerName: customerName.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Unknown error");
      setQuote(data.quote);
      setTimeout(() => {
        document.getElementById("quote-preview")?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } catch (err) {
      console.error(err);
      toast.error("Could not generate quotation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail(email: string) {
    if (!quote) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/quotation/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, quote }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Quotation sent to ${email}`);
      setEmailModalOpen(false);
    } catch {
      toast.error("Failed to send email. Please try again.");
    } finally {
      setEmailSending(false);
    }
  }

  function handlePrint() {
    if (!quote) return;
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

    const itemRows = quote.items.map((item) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
          <strong>${item.name}</strong>
          ${item.notes ? `<br/><span style="font-size:11px;color:#71717a;">${item.notes}</span>` : ""}
        </td>
        <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #f0f0f0;">${item.quantity}</td>
        <td style="padding:12px;text-align:right;border-bottom:1px solid #f0f0f0;">${fmt(item.unitPrice)}</td>
        <td style="padding:12px;text-align:right;border-bottom:1px solid #f0f0f0;font-weight:600;">${fmt(item.lineTotal)}</td>
      </tr>`).join("");

    const termsList = quote.terms.map((t) => `<li style="margin-bottom:4px;">${t}</li>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Quotation ${quote.quoteNumber} — The Saint's TechNet</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #18181b; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div style="max-width:700px;margin:0 auto;background:white;">
  <div style="background:#09090b;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <p style="color:#1a56db;font-weight:800;font-size:20px;letter-spacing:-0.02em;">The Saint's TechNet</p>
      <p style="color:#71717a;font-size:11px;margin-top:6px;line-height:1.6;">
        Built by an Engineer · CAC Registered · Lagos, Nigeria<br>
        BN: 9245886 · iamsaintcurtis@gmail.com · +234 906 089 8951
      </p>
    </div>
    <div style="text-align:right;">
      <p style="color:#a1a1aa;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Quotation</p>
      <p style="color:#1a56db;font-family:monospace;font-size:18px;font-weight:700;margin-top:4px;">${quote.quoteNumber}</p>
    </div>
  </div>

  <div style="padding:28px;display:flex;flex-direction:column;gap:22px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin-bottom:4px;">Prepared for</p>
        <p style="font-weight:700;font-size:17px;">${quote.customerName}</p>
        ${quote.customerPhone ? `<p style="font-size:12px;color:#52525b;margin-top:3px;">${quote.customerPhone}</p>` : ""}
        ${quote.customerAddress ? `<p style="font-size:12px;color:#52525b;margin-top:2px;">${quote.customerAddress}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin-bottom:4px;">Validity</p>
        <p style="font-weight:600;">Until ${quote.validUntil}</p>
        <p style="font-size:11px;color:#71717a;margin-top:2px;">Issued ${quote.quoteDate}</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f4f4f5;">
          <th style="text-align:left;padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;">Item</th>
          <th style="text-align:center;padding:10px 8px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;width:60px;">Qty</th>
          <th style="text-align:right;padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;width:140px;">Unit Price</th>
          <th style="text-align:right;padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;color:#71717a;width:140px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;">
      <div style="width:280px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#52525b;">
          <span>Subtotal</span><span>${fmt(quote.subtotal)}</span>
        </div>
        ${quote.vatAmount ? `<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:#52525b;"><span>${quote.vatNote} (7.5%)</span><span>${fmt(quote.vatAmount)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;padding:10px 0 0;border-top:2px solid #e4e4e7;margin-top:6px;">
          <span>Grand Total</span><span style="color:#1a56db;">${fmt(quote.grandTotal)}</span>
        </div>
      </div>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1a56db;margin-bottom:8px;">Note from the Engineer</p>
      <p style="font-size:13px;color:#334155;line-height:1.6;">${quote.engineerNote}</p>
    </div>

    <div>
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#71717a;margin-bottom:10px;">Terms &amp; Conditions</p>
      <ul style="padding-left:16px;font-size:12px;color:#52525b;columns:2;gap:16px;">${termsList}</ul>
    </div>

    <div style="border-top:1px solid #f4f4f5;padding-top:16px;text-align:center;">
      <p style="font-size:12px;color:#71717a;">
        To accept: WhatsApp <strong>+234 906 089 8951</strong> with quote number <strong style="font-family:monospace;">${quote.quoteNumber}</strong>
      </p>
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  const estimatedTotal = items.reduce((sum, i) => sum + (i.unitPrice || 0) * (i.quantity || 1), 0);
  const filledItems = items.filter((i) => i.name.trim() && i.unitPrice > 0);
  const defaultEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <>
      <EmailModal
        open={emailModalOpen}
        defaultEmail={defaultEmail}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
        sending={emailSending}
      />

      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

          {/* ── Page Header ── */}
          <div className="mb-8 no-print">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors mb-5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to shop
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 shrink-0 shadow-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Get a Quotation</h1>
                <p className="text-sm text-zinc-500 dark:text-[#a3a3a3] mt-0.5">
                  AI-generated formal quote — for corporate orders, schools & bulk purchases
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-violet-100 dark:border-violet-500/15 bg-violet-50 dark:bg-violet-500/8 px-4 py-3">
              <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                <span className="font-semibold">How it works:</span> Search products from our catalogue (prices auto-fill) or type custom items. Add your name, hit Generate — get a branded PDF-ready quotation in seconds.
              </p>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="space-y-5 no-print">
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1] mb-4">Customer Details</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="quotation-customer-name" className={labelClass}>Name or organisation <span className="text-red-500">*</span></label>
                    <input
                      id="quotation-customer-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Greenfield Secondary School"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="quotation-customer-phone" className={labelClass}>Phone number</label>
                    <input
                      id="quotation-customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="quotation-customer-address" className={labelClass}>Delivery address</label>
                    <input
                      id="quotation-customer-address"
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. 12 Adeola Odeku St, Victoria Island, Lagos"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="quotation-notes" className={labelClass}>
                      Notes <span className="text-zinc-400 text-xs font-normal">(optional)</span>
                    </label>
                    <input
                      id="quotation-notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. need delivery by Friday"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Items</h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Search our catalogue — prices fill automatically</p>
                </div>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
              </div>

              <div className="hidden sm:grid sm:grid-cols-12 gap-2 mb-2 px-1">
                <span className="col-span-6 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">Product / Description</span>
                <span className="col-span-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 text-center">Qty</span>
                <span className="col-span-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 text-right">Unit Price (₦)</span>
                <span className="col-span-1" />
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-12 sm:col-span-6">
                      <ProductSearchInput
                        value={item.name}
                        onChange={(val) => updateItem(item.id, "name", val)}
                        onSelectProduct={(product) => selectProductForItem(item.id, product)}
                        placeholder={`Item ${idx + 1} — search or describe`}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                        className={inputClass + " text-center"}
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-3">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400">₦</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.unitPrice || ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            updateItem(item.id, "unitPrice", parseFloat(raw) || 0);
                            updateItem(item.id, "fromCatalogue", false);
                          }}
                          placeholder="0"
                          className={inputClass + " pl-7 text-right " + (item.fromCatalogue ? "bg-brand-50 dark:bg-brand-950/20 border-brand-300 dark:border-brand-700/50" : "")}
                        />
                      </div>
                      {item.unitPrice > 0 && item.quantity > 1 && (
                        <p className="text-right text-[10px] text-zinc-400 mt-0.5">= {formatPrice(item.unitPrice * item.quantity)}</p>
                      )}
                      {item.fromCatalogue && (
                        <p className="text-right text-[10px] text-brand-600 dark:text-brand-400 mt-0.5">✦ catalogue price</p>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-center items-center pt-2.5">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {estimatedTotal > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
                      Estimated total
                      {filledItems.length > 0 && <span className="ml-1.5 text-xs text-zinc-400">({filledItems.length} {filledItems.length === 1 ? "item" : "items"})</span>}
                    </span>
                    <span className="text-base font-bold text-zinc-900 dark:text-brand-400">{formatPrice(estimatedTotal)}</span>
                  </div>
                  {filledItems.length > 1 && (
                    <div className="mt-2 space-y-1">
                      {filledItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-zinc-400 dark:text-zinc-600">
                          <span className="truncate max-w-[200px]">{item.name} × {item.quantity}</span>
                          <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={generateQuote}
              disabled={loading || filledItems.length === 0}
              className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-sm gap-2 transition-all disabled:opacity-40"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating your quotation…</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Formal Quotation
                  {filledItems.length > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                      {filledItems.length} {filledItems.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>

          {/* ── Quote Preview ── */}
          {quote && (
            <div id="quote-preview" className="mt-10 no-print">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-[#f1f1f1]">Quotation Ready</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEmailModalOpen(true)}
                    className="gap-1.5 border-zinc-200 dark:border-[#2a2a2a]"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5 border-zinc-200 dark:border-[#2a2a2a]"
                  >
                    <Printer className="h-4 w-4" />
                    Print / PDF
                  </Button>
                </div>
              </div>

              {/* Screen-visible quote */}
              <div
                ref={printRef}
                className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden"
              >
                <QuotePrintLayout quote={quote} />

                {/* CTA footer — screen only */}
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-zinc-100 dark:border-[#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">To accept this quotation:</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        WhatsApp us with your quote number{" "}
                        <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">{quote.quoteNumber}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => setEmailModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 px-4 py-2 text-sm font-bold text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-colors"
                      >
                        <Mail className="h-4 w-4" /> Email Quote
                      </button>
                      <a
                        href={`https://wa.me/2349060898951?text=${encodeURIComponent(`Hi! I'd like to accept quotation ${quote.quoteNumber} for ${quote.customerName}. Grand total: ${formatPrice(quote.grandTotal)}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-2 text-sm font-bold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Accept on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Shared print layout — used both on screen and in hidden print portal ──

function QuotePrintLayout({ quote }: { quote: GeneratedQuote }) {
  return (
    <>
      {/* Letterhead */}
      <div style={{ backgroundColor: "#09090b", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#1a56db", fontWeight: 800, fontSize: "18px", margin: 0, letterSpacing: "-0.02em" }}>
            The Saint's TechNet
          </p>
          <p style={{ color: "#71717a", fontSize: "11px", marginTop: "6px", lineHeight: 1.5 }}>
            Built by an Engineer · CAC Registered · Lagos, Nigeria<br />
            BN: 9245886 · iamsaintcurtis@gmail.com · +234 906 089 8951
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#a1a1aa", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Quotation
          </p>
          <p style={{ color: "#1a56db", fontFamily: "monospace", fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>
            {quote.quoteNumber}
          </p>
        </div>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Meta */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", margin: "0 0 4px 0" }}>Prepared for</p>
            <p style={{ fontWeight: 700, fontSize: "16px", margin: 0 }}>{quote.customerName}</p>
            {quote.customerPhone && (
              <p style={{ fontSize: "12px", color: "#52525b", margin: "3px 0 0 0" }}>{quote.customerPhone}</p>
            )}
            {quote.customerAddress && (
              <p style={{ fontSize: "12px", color: "#52525b", margin: "2px 0 0 0" }}>{quote.customerAddress}</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", margin: "0 0 4px 0" }}>Validity</p>
            <p style={{ fontWeight: 600, margin: 0 }}>Until {quote.validUntil}</p>
            <p style={{ fontSize: "11px", color: "#71717a", margin: "2px 0 0 0" }}>Issued {quote.quoteDate}</p>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f5", borderBottom: "1px solid #e4e4e7" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71717a" }}>Item</th>
              <th style={{ textAlign: "center", padding: "10px 8px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71717a", width: "60px" }}>Qty</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71717a", width: "130px" }}>Unit Price</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#71717a", width: "130px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f4f4f5" }}>
                <td style={{ padding: "12px" }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{item.name}</p>
                  {item.notes && <p style={{ fontSize: "11px", color: "#71717a", margin: "2px 0 0 0" }}>{item.notes}</p>}
                </td>
                <td style={{ textAlign: "center", padding: "12px 8px", color: "#52525b" }}>{item.quantity}</td>
                <td style={{ textAlign: "right", padding: "12px", color: "#3f3f46" }}>{formatPrice(item.unitPrice)}</td>
                <td style={{ textAlign: "right", padding: "12px", fontWeight: 600 }}>{formatPrice(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", color: "#52525b" }}>
              <span>Subtotal</span><span>{formatPrice(quote.subtotal)}</span>
            </div>
            {quote.vatAmount != null && quote.vatAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", color: "#52525b" }}>
                <span>{quote.vatNote} (7.5%)</span>
                <span>{formatPrice(quote.vatAmount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, padding: "8px 0 0 0", borderTop: "2px solid #e4e4e7", marginTop: "6px" }}>
              <span>Grand Total</span>
              <span style={{ color: "#1a56db" }}>{formatPrice(quote.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Engineer note */}
        <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a56db", margin: "0 0 6px 0" }}>Note from the Engineer</p>
          <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: 1.6 }}>{quote.engineerNote}</p>
        </div>

        {/* Terms */}
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", margin: "0 0 10px 0" }}>Terms & Conditions</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
            {quote.terms.map((term, i) => (
              <div key={i} style={{ display: "flex", gap: "6px", fontSize: "11px", color: "#71717a" }}>
                <span style={{ color: "#1a56db", flexShrink: 0 }}>✦</span>{term}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}