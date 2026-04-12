"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, ShoppingBag, AlertTriangle, Loader2, Bitcoin, ChevronDown,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/app/CheckoutButton";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/app/PaymentMethodSelector";
import { ShippingCalculator, type ShippingOption } from "@/components/app/ShippingCalculator";
import { GuestCheckoutModal } from "@/components/app/GuestCheckoutModal";
import { useCurrency } from "@/lib/store/currency-store-provider";
import {
  useCartItems, useTotalPrice, useTotalItems, useCartActions,
} from "@/lib/store/cart-store-provider";
import { useCartStock } from "@/lib/hooks/useCartStock";
import { createCryptoCheckoutSession } from "@/lib/actions/crypto-checkout";
import { toast } from "sonner";

// ── Country + State data ────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "OTHER", name: "Other" },
];

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const UK_REGIONS = [
  "England", "Scotland", "Wales", "Northern Ireland",
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

function getStates(countryCode: string): string[] {
  switch (countryCode) {
    case "NG": return NIGERIA_STATES;
    case "GB": return UK_REGIONS;
    case "US": return US_STATES;
    default: return [];
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  countryCode: string;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors";

const selectClass =
  "w-full appearance-none rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 pr-9 text-sm text-zinc-900 dark:text-[#f1f1f1] focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors cursor-pointer";

const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

// ── Component ────────────────────────────────────────────────────────────────

export function CheckoutClient() {
  const { isSignedIn, isLoaded } = useAuth();
  const items = useCartItems();
  const totalPrice = useTotalPrice();
  const totalItems = useTotalItems();
  const { clearCart } = useCartActions();
  const { formatInCurrency } = useCurrency();
  const { stockMap, isLoading, hasStockIssues } = useCartStock(items);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [isCryptoLoading, setIsCryptoLoading] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    name: "", line1: "", line2: "", city: "", state: "",
    postcode: "", country: "Nigeria", countryCode: "NG",
  });

  const states = getStates(address.countryCode);
  const shippingFee = selectedShipping?.price ?? 0;
  const shippingMethod = selectedShipping?.method ?? "";
  const grandTotal = totalPrice + shippingFee;

  const isAddressComplete =
    address.name.trim() !== "" &&
    address.line1.trim() !== "" &&
    address.city.trim() !== "" &&
    address.postcode.trim() !== "" &&
    address.country.trim() !== "" &&
    !!selectedShipping;

  // When country changes, reset state
  function handleCountryChange(code: string) {
    const country = COUNTRIES.find((c) => c.code === code);
    setAddress((a) => ({
      ...a,
      countryCode: code,
      country: country?.name ?? code,
      state: "",
    }));
    setSelectedShipping(null);
  }

  // When city changes, reset shipping selection
  function handleCityChange(city: string) {
    setAddress((a) => ({ ...a, city }));
    setSelectedShipping(null);
  }

  async function handleCryptoCheckout() {
    if (!isSignedIn) { setGuestModalOpen(true); return; }
    if (!isAddressComplete || hasStockIssues || isLoading) return;
    setIsCryptoLoading(true);
    try {
      const result = await createCryptoCheckoutSession(items, address);
      if (result.success && result.url) {
        clearCart();
        window.location.href = result.url;
      } else {
        toast.error(result.error ?? "Could not start crypto payment");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCryptoLoading(false);
    }
  }

  function handlePaystackClick() {
    if (!isSignedIn) {
      setGuestModalOpen(true);
      return;
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Your cart is empty</h1>
          <p className="mt-2 text-zinc-500 dark:text-[#a3a3a3]">Add some items before checking out.</p>
          <Button asChild className="mt-8 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Guest sign-in modal */}
      <GuestCheckoutModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        itemCount={totalItems}
      />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Checkout</h1>

          {/* Guest banner */}
          {isLoaded && !isSignedIn && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Sign in required</span> — you need an account to complete your purchase.
              </p>
              <Button
                size="sm"
                onClick={() => setGuestModalOpen(true)}
                className="shrink-0 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold h-8 px-3 text-xs"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-5 lg:gap-8">

          {/* ── Left: Cart + Address + Shipping ── */}
          <div className="space-y-5 lg:col-span-3">

            {/* Cart Items */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
              <div className="border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-3.5">
                <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                  Order Summary ({totalItems} {totalItems === 1 ? "item" : "items"})
                </h2>
              </div>

              {hasStockIssues && !isLoading && (
                <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>Some items have stock issues. Please update your cart.</span>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  <span className="ml-2 text-sm text-zinc-500 dark:text-[#a3a3a3]">Verifying stock...</span>
                </div>
              )}

              <div className="divide-y divide-zinc-100 dark:divide-[#1a1a1a]">
                {items.map((item) => {
                  const stockInfo = stockMap.get(item.productId);
                  const hasIssue = stockInfo?.isOutOfStock || stockInfo?.exceedsStock;
                  return (
                    <div key={item.productId} className={`flex gap-3 px-5 py-4 ${hasIssue ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]">
                        {item.image
                          ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                          : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No image</div>}
                      </div>
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <p className="font-medium text-sm text-zinc-900 dark:text-[#f1f1f1] line-clamp-2">{item.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">Qty: {item.quantity}</p>
                        {stockInfo?.isOutOfStock && <p className="text-xs font-medium text-red-600 dark:text-red-400">Out of stock</p>}
                        {stockInfo?.exceedsStock && !stockInfo.isOutOfStock && (
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Only {stockInfo.currentStock} available</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-amber-400">{formatInCurrency(item.price * item.quantity)}</p>
                        {item.quantity > 1 && <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{formatInCurrency(item.price)} each</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
              <div className="border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-3.5">
                <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Shipping Address</h2>
              </div>
              <div className="space-y-4 px-5 py-4">

                {/* Full Name */}
                <div>
                  <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={address.name}
                    onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                    placeholder="John Doe" className={inputClass} />
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className={labelClass}>Address Line 1 <span className="text-red-500">*</span></label>
                  <input type="text" value={address.line1}
                    onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                    placeholder="12 Lagos Street" className={inputClass} />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className={labelClass}>Address Line 2 <span className="text-zinc-400 text-xs">(optional)</span></label>
                  <input type="text" value={address.line2}
                    onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                    placeholder="Apartment, suite, etc." className={inputClass} />
                </div>

                {/* Country dropdown */}
                <div>
                  <label className={labelClass}>Country <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={address.countryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={selectClass}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>
                </div>

                {/* State/Region dropdown — only if country has states */}
                {states.length > 0 && (
                  <div>
                    <label className={labelClass}>
                      {address.countryCode === "NG" ? "State" : "Region / State"}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={address.state}
                        onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">Select {address.countryCode === "NG" ? "State" : "Region"}...</option>
                        {states.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                )}

                {/* City + Postcode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>City <span className="text-red-500">*</span></label>
                    <input type="text" value={address.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="Lagos" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Postcode <span className="text-red-500">*</span></label>
                    <input type="text" value={address.postcode}
                      onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value }))}
                      placeholder="100001" className={inputClass} />
                  </div>
                </div>

                {/* Shipping Calculator — appears after city + country are filled */}
                {(address.city || address.state) && address.country && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-[#1a1a1a]">
                    <label className={labelClass + " mb-3"}>
                      Shipping Method <span className="text-red-500">*</span>
                    </label>
                    <ShippingCalculator
                      city={address.state || address.city}
                      country={address.country}
                      onSelect={setSelectedShipping}
                      selected={selectedShipping}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Payment Summary ── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-4 rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Payment Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-[#a3a3a3]">Subtotal</span>
                  <span className="text-zinc-900 dark:text-[#f1f1f1]">{formatInCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-[#a3a3a3]">Shipping</span>
                  {selectedShipping ? (
                    <span className={shippingFee === 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-zinc-900 dark:text-[#f1f1f1]"}>
                      {shippingFee === 0 ? "Free" : formatInCurrency(shippingFee)}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400 dark:text-[#555]">Select method below</span>
                  )}
                </div>
                {selectedShipping && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 dark:text-[#555]">via {selectedShipping.carrier}</span>
                    <span className="text-zinc-400 dark:text-[#555]">{selectedShipping.estimatedDays}</span>
                  </div>
                )}
                <div className="border-t border-zinc-100 dark:border-[#1a1a1a] pt-2 flex justify-between font-bold text-base">
                  <span className="text-zinc-900 dark:text-[#f1f1f1]">Total</span>
                  <span className="text-zinc-900 dark:text-amber-400">{formatInCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t border-zinc-100 dark:border-[#1a1a1a] pt-4">
                <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
              </div>

              {/* Pay Button */}
              <div className="pt-1">
                {paymentMethod === "paystack" ? (
                  !isSignedIn ? (
                    <Button
                      onClick={() => setGuestModalOpen(true)}
                      className="w-full h-12 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold shadow-lg shadow-amber-500/20"
                    >
                      Sign In to Pay
                    </Button>
                  ) : (
                    <CheckoutButton
                      disabled={hasStockIssues || isLoading || !isAddressComplete}
                      shippingAddress={address}
                      shippingFee={shippingFee}
                      shippingMethod={shippingMethod}
                    />
                  )
                ) : (
                  <Button
                    className="w-full h-12 gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white font-bold hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 disabled:opacity-50"
                    disabled={hasStockIssues || isLoading || !isAddressComplete || isCryptoLoading}
                    onClick={handleCryptoCheckout}
                  >
                    {isCryptoLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing...</>
                      : <>Pay with Crypto</>
                    }
                  </Button>
                )}
              </div>

              {!isAddressComplete && isSignedIn && (
                <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                  {!selectedShipping
                    ? "↓ Select a shipping method to continue"
                    : "↓ Fill in your shipping address to continue"}
                </p>
              )}

              <p className="text-center text-xs text-zinc-400 dark:text-[#555]">
                {paymentMethod === "paystack" ? "Secure checkout via Paystack" : "Powered by NOWPayments"}
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}