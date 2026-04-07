"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Currency = "NGN" | "USD";

interface CurrencyContextValue {
  currency: Currency;
  rate: number; // NGN per 1 USD
  toggleCurrency: () => void;
  formatInCurrency: (ngnAmount: number | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NGN",
  rate: 1600,
  toggleCurrency: () => {},
  formatInCurrency: (n) => `₦${(n ?? 0).toLocaleString()}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [rate, setRate] = useState(1600);

  // Fetch rate on mount
  useEffect(() => {
    fetch("/api/currency")
      .then((r) => r.json())
      .then((d) => { if (d.rate) setRate(d.rate); })
      .catch(() => {});
  }, []);

  function toggleCurrency() {
    setCurrency((c) => (c === "NGN" ? "USD" : "NGN"));
  }

  function formatInCurrency(ngnAmount: number | null | undefined): string {
    const amount = ngnAmount ?? 0;
    if (currency === "USD") {
      const usd = amount / rate;
      return `$${usd.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
    return `₦${amount.toLocaleString()}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, rate, toggleCurrency, formatInCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}