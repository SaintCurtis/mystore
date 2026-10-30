"use client";

import { Receipt } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNaira } from "@/lib/receipts/money";
import type { ReceiptSummary, StoredReceipt } from "@/lib/receipts/types";
import { fetchSummary, type IssueResult } from "./api";
import { IssuedPanel } from "./IssuedPanel";
import { ReceiptForm } from "./ReceiptForm";
import { ReceiptHistory } from "./ReceiptHistory";

interface IssuedState {
  receipt: StoredReceipt;
  email: IssueResult["email"];
  duplicate: boolean;
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/30"
          : "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      }
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function ReceiptIssuance() {
  const [tab, setTab] = useState<"new" | "history">("new");
  const [issued, setIssued] = useState<IssuedState | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<ReceiptSummary | null>(null);

  const refreshSummary = useCallback(() => {
    fetchSummary()
      .then(setSummary)
      .catch(() => {
        /* the stat cards are a bonus; an error here shouldn't interrupt issuing */
      });
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  function handleIssued(result: IssueResult) {
    setIssued({
      receipt: result.receipt,
      email: result.email,
      duplicate: result.duplicate,
    });
    setRefreshKey((k) => k + 1);
    refreshSummary();

    const number = result.receipt.receiptNumber;
    if (result.duplicate) {
      toast.info(`${number} was already issued. Showing it again.`);
    } else if (result.email?.ok) {
      toast.success(`${number} issued and emailed to ${result.email.to}`);
    } else if (result.email && !result.email.ok) {
      toast.warning(`${number} issued, but the email didn't go through`);
    } else {
      toast.success(`${number} issued`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    setIssued(null);
    setFormKey((k) => k + 1);
    setTab("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Receipt issuance
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Issue a numbered PDF receipt for a walk-in sale, then download it,
            share it, or email it to the customer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summary ? (
          <>
            <StatCard
              label="Issued today"
              value={formatNaira(summary.today.total)}
              hint={plural(summary.today.count, "receipt")}
            />
            <StatCard
              label="This month"
              value={formatNaira(summary.month.total)}
              hint={plural(summary.month.count, "receipt")}
            />
            <StatCard
              label="Balances still owed"
              value={formatNaira(summary.outstanding.total)}
              hint={
                summary.outstanding.count > 0
                  ? `across ${plural(summary.outstanding.count, "receipt")}`
                  : "all paid in full"
              }
              accent={summary.outstanding.count > 0}
            />
          </>
        ) : (
          ["today", "month", "owed"].map((key) => (
            <Skeleton key={key} className="h-[92px] w-full rounded-2xl" />
          ))
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "new" | "history")}
      >
        <TabsList>
          <TabsTrigger value="new">
            {issued ? "Issued receipt" : "New receipt"}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          {issued ? (
            <IssuedPanel
              key={issued.receipt.receiptNumber}
              receipt={issued.receipt}
              initialEmail={issued.email}
              duplicate={issued.duplicate}
              onReceiptChange={(receipt) => {
                setIssued((current) =>
                  current ? { ...current, receipt } : current,
                );
                setRefreshKey((k) => k + 1);
              }}
              onNew={startNew}
            />
          ) : (
            <ReceiptForm key={formKey} onIssued={handleIssued} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ReceiptHistory refreshKey={refreshKey} onChanged={refreshSummary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
