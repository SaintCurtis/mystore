"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { writeClient } from "@/sanity/lib/client";
import { ORDER_STATUS_CONFIG, getOrderStatus, type OrderStatusValue } from "@/lib/constants/orderStatus";

interface StatusSelectProps {
  documentId: string;
  initialStatus?: string;
}

export function StatusSelect({ documentId, initialStatus = "paid" }: StatusSelectProps) {
  const [status, setStatus] = useState<OrderStatusValue>(initialStatus as OrderStatusValue);
  const [saving, setSaving] = useState(false);

  // Sync initialStatus when it changes
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus as OrderStatusValue);
    }
  }, [initialStatus]);

  const handleStatusChange = async (newStatus: OrderStatusValue) => {
    if (newStatus === status) return;

    setSaving(true);
    setStatus(newStatus);

    try {
      await writeClient
        .patch(documentId)
        .set({ status: newStatus })
        .commit();
    } catch (error) {
      console.error("Failed to update order status:", error);
      // Revert on error
      setStatus(status);
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = getOrderStatus(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative">
      <Select value={status} onValueChange={handleStatusChange} disabled={saving}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => {
            const Icon = config.icon;
            return (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {saving && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}

export function StatusSelectSkeleton() {
  return <Skeleton className="h-10 w-[180px]" />;
}