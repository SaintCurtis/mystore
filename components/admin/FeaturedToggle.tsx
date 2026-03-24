"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { writeClient } from "@/sanity/lib/client";
import { cn } from "@/lib/utils";

interface FeaturedToggleProps {
  documentId: string;
  initialFeatured: boolean;
}

export function FeaturedToggle({ documentId, initialFeatured }: FeaturedToggleProps) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [saving, setSaving] = useState(false);

  const toggleFeatured = async () => {
    const newValue = !featured;
    setFeatured(newValue);
    setSaving(true);

    try {
      await writeClient
        .patch(documentId)
        .set({ featured: newValue })
        .commit();
    } catch (error) {
      console.error("Failed to update featured:", error);
      setFeatured(!newValue); // revert on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggleFeatured}
      disabled={saving}
      title={featured ? "Remove from featured" : "Add to featured"}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-colors",
          featured
            ? "fill-amber-400 text-amber-400"
            : "text-zinc-300 dark:text-zinc-600"
        )}
      />
    </Button>
  );
}