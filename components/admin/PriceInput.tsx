"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { writeClient } from "@/sanity/lib/client";

interface PriceInputProps {
  documentId: string;
  initialPrice: number;
}

export function PriceInput({ documentId, initialPrice }: PriceInputProps) {
  const [price, setPrice] = useState(initialPrice);
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (price === initialPrice) return;

    setSaving(true);
    try {
      await writeClient
        .patch(documentId)
        .set({ price })
        .commit();
    } catch (error) {
      console.error("Failed to update price:", error);
      setPrice(initialPrice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-zinc-500">₦</span>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={price}
        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
        onBlur={handleBlur}
        className="h-8 w-24 text-right"
        disabled={saving}
      />
      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
    </div>
  );
}