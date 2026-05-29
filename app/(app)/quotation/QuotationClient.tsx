"use client";

// app/(app)/quotation/QuotationClient.tsx

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText, Plus, Trash2, Sparkles, ArrowLeft, Printer,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface GeneratedQuote {
  quoteNumber: string;
  customerName: string;
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
  vatNote: string;
  grandTotal: number;
  terms: string[];
  engineerNote: string;
}

// ── Styles ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

// ── Component ─────────────────────────────────────────────────────────────

export function QuotationClient() {
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", name: "", quantity: 1, unitPrice: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<GeneratedQuote | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof Omit<QuoteItem, "id">, value: string | number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
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
          items: validItems.map(({ name, quantity, unitPrice }) => ({
            name,
            quantity,
            unitPrice,
          })),
          customerName: customerName.trim() || undefined,
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

  const estimatedTotal = items.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * (i.quantity || 1),
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">

      {/* Print styles — hides everything except the quote when printing */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #quote-printable,
          #quote-printable * { display: revert !important; }
          #quote-printable {
            position: fixed !important;
            inset: 0 !important;
            padding: 2rem !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 shrink-0 shadow-lg shadow-violet-500/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
                Get a Quotation
              </h1>
              <p className="text-sm text-zinc-500 dark:text-[#a3a3a3] mt-0.5">
                AI-generated formal quote — for corporate orders, schools & bulk purchases
              </p>
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="space-y-5">

          {/* Customer details */}
          <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
            <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1] mb-4">
              Customer Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Your name or organisation
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Greenfield Secondary School"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Notes{" "}
                  <span className="text-zinc-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. need delivery by Friday, Lagos only"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Items</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 mb-2 px-1">
              <span className="col-span-6 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">Product / Description</span>
              <span className="col-span-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 text-center">Qty</span>
              <span className="col-span-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 text-right">Unit Price (₦)</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                  {/* Name */}
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      placeholder={`Item ${idx + 1} — e.g. MacBook Air M2 (Foreign Used)`}
                      className={inputClass}
                    />
                  </div>
                  {/* Qty */}
                  <div className="col-span-3 sm:col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className={inputClass + " text-center"}
                    />
                  </div>
                  {/* Price */}
                  <div className="col-span-8 sm:col-span-3">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className={inputClass + " text-right"}
                    />
                  </div>
                  {/* Delete */}
                  <div className="col-span-1 flex justify-center items-center pt-2.5">
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated total preview */}
            {estimatedTotal > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-[#1a1a1a] flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-[#a3a3a3]">Estimated total</span>
                <span className="text-base font-bold text-zinc-900 dark:text-amber-400">
                  {formatPrice(estimatedTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Generate button */}
          <Button
            onClick={generateQuote}
            disabled={loading}
            className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/20 gap-2 transition-all"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                Generating your quotation…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Formal Quotation
              </>
            )}
          </Button>
        </div>

        {/* ── Quote Preview ── */}
        {quote && (
          <div id="quote-preview" className="mt-10">

            {/* Preview header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-[#f1f1f1]">
                  Quotation Ready
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 border-zinc-200 dark:border-[#2a2a2a]"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </Button>
            </div>

            {/* The printable document */}
            <div
              id="quote-printable"
              ref={printRef}
              className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden"
            >
              {/* Letterhead */}
              <div className="bg-zinc-950 px-6 py-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-amber-400 font-extrabold text-xl tracking-tight leading-none">
                    The Saint's TechNet
                  </p>
                  <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                    Built by an Engineer · CAC Registered · Lagos, Nigeria
                    <br />
                    BN: 9245886 · iamsaintcurtis@gmail.com · +234 906 089 8951
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-zinc-300 text-xs font-semibold uppercase tracking-widest">
                    Quotation
                  </p>
                  <p className="text-amber-400 font-mono text-lg font-bold mt-0.5">
                    {quote.quoteNumber}
                  </p>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">

                {/* Meta row */}
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Prepared for
                    </p>
                    <p className="font-bold text-zinc-900 dark:text-[#f1f1f1] text-base">
                      {quote.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Validity
                    </p>
                    <p className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                      Until {quote.validUntil}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">Issued {quote.quoteDate}</p>
                  </div>
                </div>

                {/* Items table */}
                <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-[#1a1a1a]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-[#0d0d0d] border-b border-zinc-100 dark:border-[#1a1a1a]">
                        <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                          Item
                        </th>
                        <th className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                          Unit Price
                        </th>
                        <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#1a1a1a]">
                      {quote.items.map((item, i) => (
                        <tr
                          key={i}
                          className="hover:bg-zinc-50/50 dark:hover:bg-white/2 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-zinc-900 dark:text-[#f1f1f1]">
                              {item.name}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-zinc-400 mt-0.5">{item.notes}</p>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-center text-zinc-600 dark:text-zinc-400">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-right text-zinc-700 dark:text-zinc-300">
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                            {formatPrice(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-[#a3a3a3]">Subtotal</span>
                      <span className="text-zinc-900 dark:text-[#f1f1f1]">
                        {formatPrice(quote.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">{quote.vatNote}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-[#1a1a1a] font-bold text-base">
                      <span className="text-zinc-900 dark:text-[#f1f1f1]">Grand Total</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {formatPrice(quote.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Engineer note */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5">
                    Note from the Engineer
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    {quote.engineerNote}
                  </p>
                </div>

                {/* Terms */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2.5">
                    Terms & Conditions
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {quote.terms.map((term, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        <span className="text-amber-500 mt-px shrink-0">✦</span>
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA footer */}
                <div className="pt-2 border-t border-zinc-100 dark:border-[#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      To accept this quotation:
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Shop on our website, or WhatsApp us with your quote number{" "}
                      <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">
                        {quote.quoteNumber}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`https://wa.me/2349060898951?text=${encodeURIComponent(
                        `Hi! I'd like to accept quotation ${quote.quoteNumber} for ${quote.customerName}. Grand total: ${formatPrice(quote.grandTotal)}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-2 text-sm font-bold text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      Accept on WhatsApp
                    </a>
                    <Link
                      href="/"
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-950 transition-colors"
                    >
                      Shop Now →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}