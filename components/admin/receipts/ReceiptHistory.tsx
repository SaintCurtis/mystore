"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  MailX,
  ReceiptText,
  RefreshCw,
  Search,
  Share2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  formatReceiptDateTime,
  formatReceiptShortDate,
} from "@/lib/receipts/dates";
import { formatNaira } from "@/lib/receipts/money";
import {
  ITEM_CONDITION_LABELS,
  PAYMENT_METHOD_LABELS,
  type ReceiptListRow,
  type StoredReceipt,
} from "@/lib/receipts/types";
import { cn } from "@/lib/utils";
import {
  ApiError,
  canShareFiles,
  emailReceipt,
  fetchPdfBlob,
  fetchReceipt,
  listReceipts,
  openPdfInNewTab,
  pdfFileName,
  saveBlob,
  shareBlob,
  voidReceipt,
} from "./api";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "part", label: "Part payment" },
  { value: "not_emailed", label: "Not emailed" },
  { value: "void", label: "Void" },
] as const;

function StatusBadge({
  row,
}: {
  row: Pick<ReceiptListRow, "status" | "balance">;
}) {
  if (row.status === "void") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
        Void
      </span>
    );
  }
  if (row.balance > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
        Part payment
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
      Paid
    </span>
  );
}

function EmailBadge({
  status,
  count,
}: {
  status?: "sent" | "failed";
  count: number;
}) {
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
        <AlertTriangle className="h-3 w-3" /> Email failed
      </span>
    );
  }
  if (count > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Emailed
        {count > 1 ? ` ×${count}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
      <MailX className="h-3 w-3" /> Not emailed
    </span>
  );
}

interface Props {
  /** Bumped by the parent after a receipt is issued so this list reloads. */
  refreshKey: number;
  /** Called after anything here changes totals (void, email) so the stat cards refresh. */
  onChanged: () => void;
}

export function ReceiptHistory({ refreshKey, onChanged }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["value"]>("all");
  const [rows, setRows] = useState<ReceiptListRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openNumber, setOpenNumber] = useState<string | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const result = await listReceipts({ q: debounced, filter });
      if (id !== sequence.current) return;
      setRows(result.rows);
      setNextCursor(result.nextCursor);
    } catch (err) {
      if (id !== sequence.current) return;
      setError(
        err instanceof ApiError ? err.message : "Could not load receipts.",
      );
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  }, [debounced, filter]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is the parent's "reload now" signal (a receipt was just issued)
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await listReceipts({
        q: debounced,
        filter,
        cursor: nextCursor,
      });
      setRows((current) => [...current, ...result.rows]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not load more receipts.",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function quickDownload(row: ReceiptListRow) {
    try {
      saveBlob(
        await fetchPdfBlob(row.receiptNumber),
        pdfFileName(row.receiptNumber),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not download the PDF.",
      );
    }
  }

  const changed = () => {
    onChanged();
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by receipt number, name, phone or email"
            className="pl-9 pr-9"
            aria-label="Search receipts"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void load()}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />{" "}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filter === f.value
                ? "border-brand-600 bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Try again
          </Button>
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="space-y-2">
          {["a", "b", "c", "d", "e"].map((key) => (
            <Skeleton key={key} className="h-[74px] w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={
            debounced || filter !== "all"
              ? "No receipts match"
              : "No receipts yet"
          }
          description={
            debounced || filter !== "all"
              ? "Try a different search or filter."
              : "Receipts you issue will appear here, ready to download or email."
          }
        />
      ) : (
        <ul className={cn("space-y-2", loading && "opacity-60")}>
          {rows.map((row) => (
            <li key={row.receiptNumber}>
              <div className="group flex items-center rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setOpenNumber(row.receiptNumber)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-4 text-left focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          "text-sm font-semibold text-zinc-900 dark:text-zinc-100",
                          row.status === "void" &&
                            "line-through decoration-zinc-400",
                        )}
                      >
                        {row.receiptNumber}
                      </span>
                      <StatusBadge row={row} />
                      <EmailBadge
                        status={row.lastEmailStatus}
                        count={row.emailCount}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-700 dark:text-zinc-300">
                      {row.customerName}
                      <span className="text-zinc-400">
                        {" "}
                        · {row.itemCount}{" "}
                        {row.itemCount === 1 ? "item" : "items"}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatReceiptShortDate(row.issuedAt)} ·{" "}
                      {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                      {row.customerPhone ? ` · ${row.customerPhone}` : ""}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {formatNaira(row.total)}
                    </p>
                    {row.status === "issued" && row.balance > 0 && (
                      <p className="text-xs font-medium text-brand-700 dark:text-brand-400">
                        owes {formatNaira(row.balance)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
                </button>
                <button
                  type="button"
                  onClick={() => void quickDownload(row)}
                  className="mr-3 hidden shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 sm:block dark:hover:bg-zinc-800"
                  aria-label={`Download ${row.receiptNumber}`}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {nextCursor && !error && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Load
            more
          </Button>
        </div>
      )}

      <ReceiptDrawer
        receiptNumber={openNumber}
        onClose={() => setOpenNumber(null)}
        onChanged={changed}
      />
    </div>
  );
}

// ── Detail drawer ──────────────────────────────────────────────────────────

function ReceiptDrawer({
  receiptNumber,
  onClose,
  onChanged,
}: {
  receiptNumber: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [receipt, setReceipt] = useState<StoredReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(canShareFiles()), []);

  useEffect(() => {
    if (!receiptNumber) return;
    let cancelled = false;
    setReceipt(null);
    setError(null);
    fetchReceipt(receiptNumber)
      .then((r) => {
        if (cancelled) return;
        setReceipt(r);
        setEmailTo(r.customer.email ?? "");
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load this receipt.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [receiptNumber]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim());

  async function send() {
    if (!receipt || !emailValid) return;
    setSending(true);
    try {
      const result = await emailReceipt(receipt.receiptNumber, emailTo.trim());
      setReceipt(result.receipt);
      toast.success(`Receipt emailed to ${result.to}`);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.data?.receipt)
        setReceipt(err.data.receipt as StoredReceipt);
      toast.error(
        err instanceof ApiError ? err.message : "Could not send the email.",
      );
      onChanged();
    } finally {
      setSending(false);
    }
  }

  async function share() {
    if (!receipt) return;
    try {
      const blob = await fetchPdfBlob(receipt.receiptNumber);
      await shareBlob(
        blob,
        receipt.receiptNumber,
        `Receipt ${receipt.receiptNumber}: ${formatNaira(receipt.total)}`,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(
        "Couldn't open the share sheet. Download the PDF and attach it instead.",
      );
    }
  }

  async function confirmVoid() {
    if (!receipt) return;
    if (voidReason.trim().length < 3) {
      toast.error("Give a short reason.");
      return;
    }
    setVoiding(true);
    try {
      const updated = await voidReceipt(
        receipt.receiptNumber,
        voidReason.trim(),
      );
      setReceipt(updated);
      setVoidOpen(false);
      setVoidReason("");
      toast.success(`${updated.receiptNumber} is now void`);
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not void the receipt.",
      );
    } finally {
      setVoiding(false);
    }
  }

  const isVoid = receipt?.status === "void";

  return (
    <>
      <Sheet
        open={receiptNumber !== null}
        onOpenChange={(open) => !open && onClose()}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              {receiptNumber}
              {receipt && <StatusBadge row={receipt} />}
            </SheetTitle>
            <SheetDescription>
              {receipt
                ? formatReceiptDateTime(receipt.issuedAt)
                : "Loading receipt…"}
            </SheetDescription>
          </SheetHeader>

          {error ? (
            <p className="px-4 text-sm text-red-600">{error}</p>
          ) : !receipt ? (
            <div className="space-y-3 px-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="space-y-6 px-4 pb-8 text-sm">
              {isVoid && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  <p className="font-semibold">
                    Voided{" "}
                    {receipt.voidedAt
                      ? formatReceiptDateTime(receipt.voidedAt)
                      : ""}
                  </p>
                  {receipt.voidReason && (
                    <p className="mt-0.5">{receipt.voidReason}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() =>
                    fetchPdfBlob(receipt.receiptNumber)
                      .then((b) =>
                        saveBlob(b, pdfFileName(receipt.receiptNumber)),
                      )
                      .catch((err) =>
                        toast.error(
                          err instanceof ApiError
                            ? err.message
                            : "Could not download.",
                        ),
                      )
                  }
                >
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    openPdfInNewTab(receipt.receiptNumber).catch((err) =>
                      toast.error(
                        err instanceof ApiError
                          ? err.message
                          : "Could not open the PDF.",
                      ),
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4" /> Open
                </Button>
                {canShare && (
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-2 gap-2"
                    onClick={share}
                  >
                    <Share2 className="h-4 w-4" /> Share (WhatsApp, etc.)
                  </Button>
                )}
              </div>

              <section>
                <h3 className="mb-2 text-xs font-semibold text-zinc-500">
                  Customer
                </h3>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {receipt.customer.name}
                </p>
                {[
                  receipt.customer.phone,
                  receipt.customer.email,
                  receipt.customer.address,
                ]
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="text-zinc-600 dark:text-zinc-400">
                      {line}
                    </p>
                  ))}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold text-zinc-500">
                  Items
                </h3>
                <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {receipt.items.map((item, i) => (
                    <li
                      // biome-ignore lint/suspicious/noArrayIndexKey: read-only list that is never reordered
                      key={i}
                      className="flex items-start justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.description}
                          {item.quantity > 1 && (
                            <span className="text-zinc-500">
                              {" "}
                              × {item.quantity}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {[
                            item.condition
                              ? ITEM_CONDITION_LABELS[item.condition]
                              : null,
                            item.serial ? `S/N ${item.serial}` : null,
                            item.warranty ? `Warranty ${item.warranty}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold">
                        {formatNaira(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <dt>Subtotal</dt>
                    <dd>{formatNaira(receipt.subtotal)}</dd>
                  </div>
                  {receipt.discount > 0 && (
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <dt>Discount</dt>
                      <dd>-{formatNaira(receipt.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                    <dt>Total</dt>
                    <dd>{formatNaira(receipt.total)}</dd>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <dt>
                      Paid ({PAYMENT_METHOD_LABELS[receipt.paymentMethod]})
                    </dt>
                    <dd>{formatNaira(receipt.amountPaid)}</dd>
                  </div>
                  {receipt.balance > 0 && (
                    <div className="flex justify-between font-semibold text-brand-700 dark:text-brand-400">
                      <dt>Balance due</dt>
                      <dd>{formatNaira(receipt.balance)}</dd>
                    </div>
                  )}
                </dl>
                {(receipt.paymentReference ||
                  receipt.servedBy ||
                  receipt.notes) && (
                  <div className="mt-3 space-y-0.5 text-xs text-zinc-500">
                    {receipt.paymentReference && (
                      <p>Reference: {receipt.paymentReference}</p>
                    )}
                    {receipt.servedBy && <p>Served by {receipt.servedBy}</p>}
                    {receipt.notes && <p>Note: {receipt.notes}</p>}
                  </div>
                )}
              </section>

              {!isVoid && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold text-zinc-500">
                    Email this receipt
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      inputMode="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="customer@example.com"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 gap-2"
                      disabled={sending || !emailValid}
                      onClick={send}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-xs font-semibold text-zinc-500">
                  Email history
                </h3>
                {(receipt.emailAttempts ?? []).length === 0 ? (
                  <p className="text-zinc-500">Not emailed yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {[...(receipt.emailAttempts ?? [])]
                      .reverse()
                      .map((attempt) => (
                        <li
                          key={`${attempt.at}-${attempt.to}-${attempt.status}`}
                          className="flex items-start gap-2"
                        >
                          {attempt.status === "sent" ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                          )}
                          <div>
                            <p className="text-zinc-800 dark:text-zinc-200">
                              {attempt.status === "sent"
                                ? "Sent to"
                                : "Failed to send to"}{" "}
                              {attempt.to}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatReceiptDateTime(attempt.at)}
                              {attempt.error ? ` · ${attempt.error}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              {!isVoid && (
                <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 text-red-600 hover:text-red-700"
                    onClick={() => setVoidOpen(true)}
                  >
                    <Ban className="h-4 w-4" /> Void this receipt
                  </Button>
                  <p className="mt-2 text-xs text-zinc-500">
                    Receipts are never edited or deleted. Void a mistake (it
                    stays in the history, stamped VOID), then issue a corrected
                    one.
                  </p>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={voidOpen}
        onOpenChange={(open) => !voiding && setVoidOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void {receipt?.receiptNumber}?</DialogTitle>
            <DialogDescription>
              The receipt stays in your history, marked VOID, and any copy
              downloaded from now on carries the VOID stamp. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Reason (e.g. wrong item entered, customer returned the goods)"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={voiding}
              onClick={() => setVoidOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={voiding}
              onClick={confirmVoid}
              className="gap-2"
            >
              {voiding && <Loader2 className="h-4 w-4 animate-spin" />} Void
              receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
