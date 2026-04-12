import { NextResponse } from "next/server";

// ── Shipping Methods ────────────────────────────────────────────────────────
// Base prices in NGN, multiplied by distance tiers
// Distance is estimated from Ikeja, Lagos to the destination city

export type ShippingMethod = {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  basePrice: number;       // NGN, for Lagos within 0-50km
  pricePerKm: number;      // Additional NGN per km beyond 50km
  maxDistance: number;     // km — -1 means unlimited (international)
  icon: string;
  available: boolean;
};

// Known Nigerian cities with approximate distances from Ikeja, Lagos (km)
const NIGERIAN_CITIES: Record<string, number> = {
  // Lagos
  "lagos": 15, "ikeja": 0, "victoria island": 20, "lekki": 35,
  "ajah": 45, "badagry": 75, "ikorodu": 40, "apapa": 25,
  "surulere": 18, "yaba": 12, "maryland": 8, "mushin": 10,
  // Southwest
  "ibadan": 130, "abeokuta": 105, "sagamu": 75, "ijebu ode": 90,
  "ota": 55, "akure": 280, "ondo": 235, "ado ekiti": 310,
  // Southeast
  "benin": 310, "warri": 395, "asaba": 440, "onitsha": 475,
  "enugu": 590, "aba": 620, "port harcourt": 650, "umuahia": 570,
  "owerri": 590, "abakaliki": 630,
  // North
  "abuja": 760, "kaduna": 1050, "kano": 1180, "katsina": 1340,
  "sokoto": 1450, "zaria": 1100, "jos": 940, "bauchi": 1060,
  "maiduguri": 1340, "yola": 1175, "jalingo": 1130,
  // Other
  "calabar": 710, "uyo": 670, "makurdi": 780, "lokoja": 595,
  "ilorin": 290, "ogbomosho": 215, "osogbo": 230,
};

// International countries with approximate distance in km from Lagos
const INTERNATIONAL_COUNTRIES: Record<string, number> = {
  "ghana": 580, "togo": 210, "benin republic": 180, "côte d'ivoire": 920,
  "uk": 6200, "united kingdom": 6200, "england": 6200,
  "usa": 9500, "united states": 9500, "united states of america": 9500,
  "canada": 9800, "germany": 6700, "france": 6400, "netherlands": 6600,
  "italy": 6300, "spain": 5900, "china": 12000, "india": 9200,
  "uae": 7100, "united arab emirates": 7100, "dubai": 7100,
  "saudi arabia": 7300, "qatar": 7200, "kenya": 4300, "south africa": 5700,
};

function estimateDistance(city: string, country: string): { distance: number; isInternational: boolean } {
  const cityLower = city.toLowerCase().trim();
  const countryLower = country.toLowerCase().trim();

  // Check if international (not Nigeria)
  const isNigeria = countryLower === "nigeria" || countryLower === "" || countryLower === "ng";

  if (!isNigeria) {
    // Check known international destinations
    for (const [key, dist] of Object.entries(INTERNATIONAL_COUNTRIES)) {
      if (countryLower.includes(key) || key.includes(countryLower)) {
        return { distance: dist, isInternational: true };
      }
    }
    return { distance: 10000, isInternational: true }; // Unknown international
  }

  // Domestic — check known cities
  for (const [key, dist] of Object.entries(NIGERIAN_CITIES)) {
    if (cityLower.includes(key) || key.includes(cityLower)) {
      return { distance: dist, isInternational: false };
    }
  }

  // Unknown Nigerian city — estimate based on common patterns
  return { distance: 400, isInternational: false }; // Default mid-distance
}

function calculateShippingMethods(distance: number, isInternational: boolean): ShippingMethod[] {
  const isLagos = distance <= 50;
  const isSouthwest = distance <= 350;
  const isDomestic = !isInternational;

  return [
    // ── Lagos Only ──────────────────────────────────────────
    {
      id: "glovo",
      name: "Glovo / Uber Dispatch",
      description: "Same-day delivery within Lagos",
      estimatedDays: "Same day (2–6 hrs)",
      basePrice: 2500,
      pricePerKm: 0,
      maxDistance: 50,
      icon: "🛵",
      available: isLagos,
    },
    {
      id: "bolt-ride",
      name: "Bolt Ride",
      description: "Send via Bolt driver within Lagos",
      estimatedDays: "Same day (1–4 hrs)",
      basePrice: 3500,
      pricePerKm: 0,
      maxDistance: 50,
      icon: "🚗",
      available: isLagos,
    },

    // ── Domestic ────────────────────────────────────────────
    {
      id: "cargo-bus",
      name: "Commercial Bus Cargo",
      description: "Via inter-state transport (ABC, GUO, etc.)",
      estimatedDays: isDomestic ? (isLagos ? "1–2 days" : distance < 600 ? "1–3 days" : "2–4 days") : "N/A",
      basePrice: isLagos ? 1500 : isSouthwest ? 3000 : 4500,
      pricePerKm: 3,
      maxDistance: 1500,
      icon: "🚌",
      available: isDomestic,
    },
    {
      id: "courier-ng",
      name: "Kwik / Sendbox Courier",
      description: "Nigerian courier service, insured",
      estimatedDays: isLagos ? "Next day" : distance < 400 ? "2–3 days" : "3–5 days",
      basePrice: isLagos ? 2000 : 4000,
      pricePerKm: 5,
      maxDistance: 1500,
      icon: "📦",
      available: isDomestic,
    },

    // ── International ───────────────────────────────────────
    {
      id: "dhl",
      name: "DHL Express",
      description: "Fast, tracked, insured worldwide",
      estimatedDays: isInternational ? "3–7 business days" : "1–3 business days",
      basePrice: isInternational ? 45000 : 8000,
      pricePerKm: isInternational ? 2 : 4,
      maxDistance: -1,
      icon: "✈️",
      available: true,
    },
    {
      id: "fedex",
      name: "FedEx International",
      description: "Priority international shipping",
      estimatedDays: isInternational ? "2–5 business days" : "1–2 business days",
      basePrice: isInternational ? 55000 : 10000,
      pricePerKm: isInternational ? 2.5 : 5,
      maxDistance: -1,
      icon: "🌍",
      available: isInternational || distance > 400,
    },
  ].filter((m) => m.available).map((method) => {
    // Calculate actual price based on distance
    let price = method.basePrice;
    if (distance > 50 && method.pricePerKm > 0) {
      price += Math.round((distance - 50) * method.pricePerKm);
    }
    // Round to nearest 100
    price = Math.round(price / 100) * 100;
    return { ...method, basePrice: price };
  });
}

export async function POST(req: Request) {
  try {
    const { city, country } = await req.json();
    if (!city) return NextResponse.json({ error: "City is required" }, { status: 400 });

    const { distance, isInternational } = estimateDistance(city, country ?? "Nigeria");
    const methods = calculateShippingMethods(distance, isInternational);

    return NextResponse.json({
      distance,
      isInternational,
      methods,
      origin: "Ikeja, Lagos",
    });
  } catch {
    return NextResponse.json({ error: "Failed to calculate shipping" }, { status: 500 });
  }
}