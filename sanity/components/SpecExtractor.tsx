"use client";

import { useCallback, useState } from "react";
import { set } from "sanity";
import type { ObjectInputProps } from "sanity";

const SPEC_FIELDS = [
  "specDisplay", "specProcessor", "specRAM", "specStorage", "specGPU",
  "specBattery", "specOS", "specConnectivity", "specRefreshRate",
  "specWeight", "specExtras",
] as const;

type SpecField = (typeof SPEC_FIELDS)[number];

const FIELD_LABELS: Record<SpecField, string> = {
  specDisplay: "Display", specProcessor: "Processor", specRAM: "RAM",
  specStorage: "Storage", specGPU: "GPU", specBattery: "Battery",
  specOS: "OS", specConnectivity: "Connectivity", specRefreshRate: "Refresh Rate",
  specWeight: "Weight", specExtras: "Extra Specs",
};

type Status = "idle" | "loading" | "success" | "error" | "empty";

export function SpecExtractor(props: ObjectInputProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [filled, setFilled] = useState<Partial<Record<SpecField, string>>>({});

  const handleExtract = useCallback(async () => {
    setStatus("loading"); setMessage(""); setFilled({});
    try {
      const doc = (props.value as Record<string, unknown>) ?? {};
      const name = (doc.name as string) ?? "";
      const description = (doc.description as string) ?? "";
      if (!name && !description) {
        setStatus("empty");
        setMessage("Fill in the product name and description first.");
        return;
      }
      const res = await fetch("/api/admin/extract-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Unknown error");
      const specs: Record<string, unknown> = data.specs ?? {};
      const filledFields: Partial<Record<SpecField, string>> = {};
      const patches: ReturnType<typeof set>[] = [];
      for (const field of SPEC_FIELDS) {
        const value = specs[field];
        if (field === "specExtras") {
          if (Array.isArray(value) && value.length > 0) {
            const keyed = (value as Array<{ label: string; value: string }>).map(
              (item, i) => ({
                _key: `extra_${Date.now()}_${i}`,
                _type: "specRow",
                label: item.label ?? "",
                value: item.value ?? "",
              })
            );
            patches.push(set(keyed, [field]));
            filledFields[field] = `${value.length} extra spec${value.length !== 1 ? "s" : ""}`;
          }
        } else if (typeof value === "string" && value.trim() !== "") {
          patches.push(set(value.trim(), [field]));
          filledFields[field] = value.trim();
        }
      }
      if (patches.length === 0) {
        setStatus("empty");
        setMessage("No specs found. Add more detail to the description.");
        return;
      }
      props.onChange(patches);
      setFilled(filledFields);
      setStatus("success");
      setMessage(`${patches.length} spec field${patches.length !== 1 ? "s" : ""} filled.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }, [props]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "12px",
      padding: "16px", borderRadius: "8px", marginBottom: "4px",
      border: "1px solid #e5e7eb", background: "#fafafa",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
          background: "linear-gradient(135deg, #f59e0b, #f97316)",
          color: "white", fontSize: "16px",
        }}>
          &#10022;
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#111827" }}>
            Extract Specs with AI
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>
            Reads the name and description and auto-fills all spec fields below. No typing needed.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleExtract}
        disabled={status === "loading"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "8px", height: "40px", borderRadius: "8px",
          border: "none", fontSize: "13px", fontWeight: 700,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          background: status === "loading"
            ? "#d1d5db"
            : "linear-gradient(135deg, #f59e0b, #f97316)",
          color: status === "loading" ? "#9ca3af" : "#1a1a1a",
        }}
      >
        {status === "loading"
          ? "Extracting specs..."
          : status === "success"
          ? "Extract Again"
          : "Extract Specs from Description"}
      </button>

      {status === "success" && (
        <div style={{
          padding: "10px 12px", borderRadius: "6px",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
        }}>
          <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#15803d" }}>
            {message}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(Object.entries(filled) as [SpecField, string][]).map(([field, value]) => (
              <span key={field} style={{
                fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                background: "#dcfce7", color: "#166534", fontWeight: 500,
              }}>
                {FIELD_LABELS[field]}: {value.length > 30 ? value.slice(0, 30) + "..." : value}
              </span>
            ))}
          </div>
        </div>
      )}

      {(status === "error" || status === "empty") && (
        <div style={{
          padding: "10px 12px", borderRadius: "6px", fontSize: "12px",
          background: status === "error" ? "#fef2f2" : "#fffbeb",
          border: `1px solid ${status === "error" ? "#fecaca" : "#fde68a"}`,
          color: status === "error" ? "#dc2626" : "#92400e",
        }}>
          {message}
        </div>
      )}

      <div style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }} />
      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", fontStyle: "italic" }}>
        Spec fields appear below. Edit manually after extraction if needed.
      </p>
    </div>
  );
}