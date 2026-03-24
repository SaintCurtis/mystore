"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { writeClient } from "@/sanity/lib/client";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeleteButtonProps {
  documentId: string;
  documentType: string;
  redirectTo?: string;
}

export function DeleteButton({
  documentId,
  documentType,
  redirectTo = "/admin/inventory",
}: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const baseId = documentId.replace("drafts.", "");

  // Check if any orders reference this product
  useEffect(() => {
    async function checkReferences() {
      try {
        const orders = await writeClient.fetch<{ _id: string }[]>(
          `*[_type == "order" && references($id)]{ _id }`,
          { id: baseId }
        );
        setOrderCount(orders.length);
      } catch (error) {
        console.error("Failed to check references:", error);
        setOrderCount(0);
      } finally {
        setLoading(false);
      }
    }
    checkReferences();
  }, [baseId]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this product permanently? This cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Delete draft version if exists
      await writeClient.delete(`drafts.${baseId}`).catch(() => {
        // Ignore error if draft doesn't exist
      });
      // Delete published version
      await writeClient.delete(baseId);
      router.push(redirectTo);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-9 w-20" />;
  }

  // If orders reference this product, redirect to Studio for safe deletion
  if (orderCount && orderCount > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5" asChild>
              <Link
                href={`/studio/structure/${documentType};${baseId}`}
                target="_blank"
              >
                <Trash2 className="h-4 w-4" />
                Delete in Studio
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              This product is referenced by {orderCount} order
              {orderCount !== 1 ? "s" : ""}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="gap-1.5"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}