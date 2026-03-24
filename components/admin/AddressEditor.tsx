"use client";

import { useState, useEffect } from "react";
import { writeClient } from "@/sanity/lib/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Address {
  name?: string;
  line1?: string;
  line2?: string | null;     // ← Allow null here
  city?: string;
  postcode?: string;
  country?: string;
}

interface AddressEditorProps {
  documentId: string;
  initialAddress?: Address | null;
}

export function AddressEditor({
  documentId,
  initialAddress,
}: AddressEditorProps) {
  const [address, setAddress] = useState<Address>(initialAddress ?? {});
  const [saving, setSaving] = useState<keyof Address | null>(null);

  // Sync when initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  const handleBlur = async (field: keyof Address, value: string) => {
    if (address[field] === value) return;

    setSaving(field);

    try {
      await writeClient
        .patch(documentId)
        .set({ [`address.${field}`]: value || null })
        .commit();

      setAddress((prev) => ({ ...prev, [field]: value || null }));
    } catch (error) {
      console.error(`Failed to update address.${field}:`, error);
    } finally {
      setSaving(null);
    }
  };

  const AddressField = ({
    field,
    label,
    placeholder,
  }: {
    field: keyof Address;
    label: string;
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-xs text-zinc-500 dark:text-zinc-400">
        {label}
        {saving === field && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
      </Label>
      <Input
        id={field}
        value={address[field] ?? ""}
        onChange={(e) =>
          setAddress((prev) => ({ ...prev, [field]: e.target.value }))
        }
        onBlur={(e) => handleBlur(field, e.target.value.trim())}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <AddressField field="name" label="Full Name" placeholder="John Doe" />
      <AddressField field="line1" label="Address Line 1" placeholder="123 Main St" />
      <AddressField field="line2" label="Address Line 2" placeholder="Apt 4B (optional)" />
      <div className="grid grid-cols-2 gap-3">
        <AddressField field="city" label="City" placeholder="Lagos" />
        <AddressField field="postcode" label="Postcode" placeholder="100001" />
      </div>
      <AddressField field="country" label="Country" placeholder="Nigeria" />
    </div>
  );
}