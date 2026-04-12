"use client";

import { useState, useEffect } from "react";
import { MapPin, Truck, Package, ChevronDown } from "lucide-react";

// ── Flat-rate shipping zones from Ikeja, Lagos ────────────────────────────
// Zones based on Nigerian geography, not exact distance.
// All prices in NGN.

export interface ShippingOption {
  id: string;
  method: string;
  carrier: string;
  estimatedDays: string;
  price: number;
  description: string;
  icon: string;
}

const ZONE_RATES: Record<
  string,
  { zone: string; label: string; options: ShippingOption[] }
> = {
  // ── Lagos (same state) ──────────────────────────────────────────────────
  lagos: {
    zone: "lagos",
    label: "Lagos State",
    options: [
      {
        id: "lagos-dispatch",
        method: "Same-Day Dispatch",
        carrier: "Dispatch Rider",
        estimatedDays: "Same day (order before 12pm)",
        price: 3000,
        description: "Direct delivery by dispatch rider within Lagos",
        icon: "🛵",
      },
      {
        id: "lagos-uber",
        method: "Uber/Bolt Rider",
        carrier: "Uber / Bolt",
        estimatedDays: "1–3 hours",
        price: 4500,
        description: "Book a rider to deliver your order immediately",
        icon: "🚗",
      },
      {
        id: "lagos-glovo",
        method: "Glovo Delivery",
        carrier: "Glovo",
        estimatedDays: "1–2 hours",
        price: 3500,
        description: "Fast delivery via Glovo within Lagos",
        icon: "🟡",
      },
      {
        id: "lagos-pickup",
        method: "In-Store Pickup",
        carrier: "Ikeja, Lagos",
        estimatedDays: "Ready in 2 hours",
        price: 0,
        description: "Pick up at our Ikeja location — free",
        icon: "🏪",
      },
    ],
  },

  // ── South-West Nigeria ──────────────────────────────────────────────────
  southwest: {
    zone: "southwest",
    label: "South-West (Ogun, Oyo, Osun, Ondo, Ekiti)",
    options: [
      {
        id: "sw-gig",
        method: "GIG Logistics",
        carrier: "GIG Logistics",
        estimatedDays: "1–2 business days",
        price: 5000,
        description: "Reliable same-region delivery",
        icon: "📦",
      },
      {
        id: "sw-abc",
        method: "Commercial Bus / ABC Transport",
        carrier: "ABC / GUO Transport",
        estimatedDays: "Same day – 1 day",
        price: 3000,
        description: "Packed and sent via intercity transport",
        icon: "🚌",
      },
      {
        id: "sw-dhl",
        method: "DHL Express",
        carrier: "DHL",
        estimatedDays: "1–2 business days",
        price: 8000,
        description: "Premium tracked delivery",
        icon: "✈️",
      },
    ],
  },

  // ── South-South / South-East Nigeria ───────────────────────────────────
  southsouth: {
    zone: "southsouth",
    label: "South-South / South-East (PH, Enugu, Asaba, Calabar...)",
    options: [
      {
        id: "ss-gig",
        method: "GIG Logistics",
        carrier: "GIG Logistics",
        estimatedDays: "2–3 business days",
        price: 7000,
        description: "Door-to-door delivery",
        icon: "📦",
      },
      {
        id: "ss-abc",
        method: "Commercial Bus / Cargo",
        carrier: "ABC / Ifesinachi / Ekene Dili Chukwu",
        estimatedDays: "1–2 days",
        price: 4500,
        description: "Packed and sent via interstate cargo",
        icon: "🚌",
      },
      {
        id: "ss-dhl",
        method: "DHL Express",
        carrier: "DHL",
        estimatedDays: "2–3 business days",
        price: 12000,
        description: "Fully tracked premium delivery",
        icon: "✈️",
      },
    ],
  },

  // ── North Nigeria ────────────────────────────────────────────────────────
  north: {
    zone: "north",
    label: "Northern Nigeria (Abuja, Kano, Kaduna, Katsina...)",
    options: [
      {
        id: "n-gig",
        method: "GIG Logistics",
        carrier: "GIG Logistics",
        estimatedDays: "2–4 business days",
        price: 8500,
        description: "Nationwide door-to-door delivery",
        icon: "📦",
      },
      {
        id: "n-abc",
        method: "Commercial Cargo Bus",
        carrier: "GUO / Marwa / Peace Mass",
        estimatedDays: "1–3 days",
        price: 5500,
        description: "Cost-effective interstate cargo",
        icon: "🚌",
      },
      {
        id: "n-dhl",
        method: "DHL Express",
        carrier: "DHL",
        estimatedDays: "2–3 business days",
        price: 15000,
        description: "Tracked premium delivery",
        icon: "✈️",
      },
    ],
  },

  // ── International ────────────────────────────────────────────────────────
  international: {
    zone: "international",
    label: "International (Outside Nigeria)",
    options: [
      {
        id: "intl-dhl",
        method: "DHL International",
        carrier: "DHL",
        estimatedDays: "5–10 business days",
        price: 45000,
        description: "Tracked worldwide delivery",
        icon: "✈️",
      },
      {
        id: "intl-fedex",
        method: "FedEx International",
        carrier: "FedEx",
        estimatedDays: "5–7 business days",
        price: 55000,
        description: "Premium global delivery with full tracking",
        icon: "📬",
      },
      {
        id: "intl-cargo",
        method: "Cargo / Sea Freight",
        carrier: "Cargo (slower, cheaper)",
        estimatedDays: "3–6 weeks",
        price: 20000,
        description: "Affordable for heavy/large items",
        icon: "🚢",
      },
    ],
  },
};

// ── State → Zone mapping ──────────────────────────────────────────────────
const STATE_TO_ZONE: Record<string, string> = {
  // Lagos
  lagos: "lagos",
  // South-West
  ogun: "southwest",
  oyo: "southwest",
  osun: "southwest",
  ondo: "southwest",
  ekiti: "southwest",
  // South-South
  "rivers state": "southsouth",
  rivers: "southsouth",
  "delta state": "southsouth",
  delta: "southsouth",
  "cross river": "southsouth",
  "cross river state": "southsouth",
  akwaibom: "southsouth",
  "akwa ibom": "southsouth",
  bayelsa: "southsouth",
  edo: "southsouth",
  // South-East
  enugu: "southsouth",
  anambra: "southsouth",
  imo: "southsouth",
  abia: "southsouth",
  ebonyi: "southsouth",
  // North
  abuja: "north",
  fct: "north",
  kano: "north",
  kaduna: "north",
  katsina: "north",
  kogi: "north",
  kwara: "north",
  niger: "north",
  benue: "north",
  plateau: "north",
  nassarawa: "north",
  taraba: "north",
  gombe: "north",
  bauchi: "north",
  borno: "north",
  yobe: "north",
  adamawa: "north",
  zamfara: "north",
  sokoto: "north",
  kebbi: "north",
  jigawa: "north",
};

function detectZone(city: string, country: string): string {
  if (country.toLowerCase() !== "nigeria" && country.toLowerCase() !== "ng") {
    return "international";
  }
  const lower = city.toLowerCase().trim();
  return STATE_TO_ZONE[lower] ?? "north"; // default to north if unrecognised
}

interface ShippingCalculatorProps {
  city: string;
  country: string;
  onSelect: (option: ShippingOption) => void;
  selected: ShippingOption | null;
}

export function ShippingCalculator({
  city,
  country,
  onSelect,
  selected,
}: ShippingCalculatorProps) {
  const [zone, setZone] = useState<string>("");
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [zoneLabel, setZoneLabel] = useState("");

  useEffect(() => {
    if (!city && !country) return;
    const detected = detectZone(city, country);
    const zoneData = ZONE_RATES[detected];
    if (zoneData) {
      setZone(detected);
      setZoneLabel(zoneData.label);
      setOptions(zoneData.options);
      // Auto-select first option
      if (zoneData.options.length > 0 && !selected) {
        onSelect(zoneData.options[0]);
      }
    }
  }, [city, country]);

  if (!city || options.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Zone detected */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-2">
        <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-semibold">Shipping zone detected:</span> {zoneLabel}
        </p>
      </div>

      {/* Shipping options */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                isSelected
                  ? "border-amber-500/60 bg-amber-500/8 dark:bg-amber-500/10"
                  : "border-zinc-200 dark:border-[#2a2a2a] hover:border-zinc-300 dark:hover:border-[#3a3a3a] bg-white dark:bg-[#111111]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg leading-none mt-0.5">{option.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-[#f1f1f1]"}`}>
                      {option.method}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-[#888] mt-0.5">
                      {option.carrier} · {option.estimatedDays}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-[#666] mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {option.price === 0 ? (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Free</span>
                  ) : (
                    <span className={`text-sm font-bold ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-[#f1f1f1]"}`}>
                      ₦{option.price.toLocaleString()}
                    </span>
                  )}
                  {isSelected && (
                    <div className="mt-1 flex justify-end">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white font-bold">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}