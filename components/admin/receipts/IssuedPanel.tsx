"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Plus,
  Share2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatReceiptDateTime } from "@/lib/receipts/dates";
import { formatNaira } from "@/lib/receipts/money";
import type { StoredReceipt } from "@/lib/receipts/types";
import {
  ApiError,
  canShareFiles,
  emailReceipt,
  fetchPdfBlob,
  openPdfInNewTab,
  pdfFileName,
  saveBlob,
  shareBlob,
} from "./api";

interface Props {
  receipt: StoredReceipt;
  /** What happened with the email when the receipt was issued (if it was requested). */
  initialEmail: { ok: boolean; to: string; error?: string } | null;
  duplicate: boolean;
  onReceiptChange: (receipt: StoredReceipt) => void;
  onNew: () => void;
}

export function IssuedPanel({
  receipt,
  initialEmail,
  duplicate,
  onReceiptChange,
  onNew,
}: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [emailTo, setEmailTo] = useState(receipt.customer.email ?? "");
  const [sending, setSending] = useState(false);
  const [emailNote, setEmailNote] = useState<{
    ok: boolean;
    text: string;
  } | null>(
    initialEmail
      ? initialEmail.ok
        ? { ok: true, text: `Emailed to ${initialEmail.to}.` }
        : {
            ok: false,
            text: `The receipt was saved, but the email to ${initialEmail.to} failed: ${initialEmail.error ?? "unknown error"}`,
          }
      : null,
  );

  useEffect(() => setCanShare(canShareFiles()), []);

  // Load the PDF once; the same bytes power the preview, download and share.
  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setBlob(await fetchPdfBlob(receipt.receiptNumber));
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Could not load the PDF.",
      );
    }
  }, [receipt.receiptNumber]);

  useEffect(() => {
    setBlob(null);
    void load();
  }, [load]);

  useEffect(() => {
    if (!blob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim());

  async function sendEmail() {
    if (!emailValid) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const result = await emailReceipt(receipt.receiptNumber, emailTo.trim());
      onReceiptChange(result.receipt);
      setEmailNote({ ok: true, text: `Emailed to ${result.to}.` });
      toast.success(`Receipt emailed to ${result.to}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not send the email.";
      if (err instanceof ApiError && err.data?.receipt)
        onReceiptChange(err.data.receipt as StoredReceipt);
      setEmailNote({ ok: false, text: message });
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  async function share() {
    if (!blob) return;
    try {
      await shareBlob(
        blob,
        receipt.receiptNumber,
        `Receipt ${receipt.receiptNumber} from The Saint's TechNet: ${formatNaira(receipt.total)}`,
      );
    } catch (err) {
      // Closing the share sheet is not an error
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Sharing isn't available here. Use Download instead.");
    }
  }

  const sentCount = (receipt.emailAttempts ?? []).filter(
    (a) => a.status === "sent",
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {duplicate
                  ? "This receipt was already issued"
                  : "Receipt issued"}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {receipt.receiptNumber}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {receipt.customer.name} · {formatNaira(receipt.total)}
                {receipt.balance > 0 && (
                  <span className="font-semibold text-brand-700 dark:text-brand-400">
                    {" "}
                    · balance {formatNaira(receipt.balance)}
                  </span>
                )}
                <span className="block text-xs text-zinc-500">
                  {formatReceiptDateTime(receipt.issuedAt)}
                </span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2 bg-white dark:bg-transparent"
            onClick={onNew}
          >
            <Plus className="h-4 w-4" /> New receipt
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <Button
              type="button"
              className="w-full gap-2"
              disabled={!blob}
              onClick={() =>
                blob && saveBlob(blob, pdfFileName(receipt.receiptNumber))
              }
            >
              {blob ? (
                <Download className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                openPdfInNewTab(receipt.receiptNumber, blob).catch((err) =>
                  toast.error(
                    err instanceof ApiError
                      ? err.message
                      : "Could not open the PDF.",
                  ),
                )
              }
            >
              <ExternalLink className="h-4 w-4" /> Open in new tab
            </Button>
            {canShare && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={!blob}
                onClick={share}
              >
                <Share2 className="h-4 w-4" /> Share (WhatsApp, etc.)
              </Button>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email to customer
              </h3>
            </div>
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
              className="w-full gap-2"
              disabled={sending || !emailValid}
              onClick={sendEmail}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {sentCount > 0 ? "Send again" : "Send receipt"}
            </Button>
            {emailNote && (
              <output
                className={
                  emailNote.ok
                    ? "flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"
                    : "flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400"
                }
              >
                {emailNote.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                <span>{emailNote.text}</span>
              </output>
            )}
          </div>
        </div>

        <div className="hidden min-h-[640px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 lg:block dark:border-zinc-800 dark:bg-zinc-900">
          {loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {loadError}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void load()}
              >
                Try again
              </Button>
            </div>
          ) : previewUrl ? (
            <iframe
              title={`Receipt ${receipt.receiptNumber}`}
              src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
              className="h-[760px] w-full"
            />
          ) : (
            <Skeleton className="h-[760px] w-full rounded-none" />
          )}
        </div>
      </div>
    </div>
  );
}
