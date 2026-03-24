"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { writeClient } from "@/sanity/lib/client";

interface StockInputProps {
  documentId: string;
  initialStock: number;
}

export function StockInput({ documentId, initialStock }: StockInputProps) {
  const [stock, setStock] = useState(initialStock);
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (stock === initialStock) return; // No change

    setSaving(true);
    try {
      await writeClient
        .patch(documentId)
        .set({ stock })
        .commit();
    } catch (error) {
      console.error("Failed to update stock:", error);
      // Optional: revert on error
      setStock(initialStock);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Input
        type="number"
        min="0"
        value={stock}
        onChange={(e) => setStock(parseInt(e.target.value) || 0)}
        onBlur={handleBlur}
        className="h-8 w-20 text-center"
        disabled={saving}
      />
      {saving && (
        <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
      )}
    </div>
  );
}

export function StockInputSkeleton() {
  return <Skeleton className="h-8 w-20" />;
}