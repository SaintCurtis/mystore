"use client";

// app/(app)/checkout/CheckoutClient.tsx

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
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

function Spinner({ className }: { className?: string }) {
  return <ArrowPathIcon className={`animate-spin ${className ?? "w-4 h-4"}`} />;
}

// ── Nigeria LGAs ──────────────────────────────────────────────────────────
const NIGERIA_LGAS: Record<string, string[]> = {
  "Lagos": ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"],
  "FCT (Abuja)": ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal Area Council"],
  "Rivers": ["Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emohua","Etche","Gokana","Ikwerre","Khana","Obio-Akpor","Ogba-Egbema-Ndoni","Ogu-Bolo","Okrika","Omuma","Opobo-Nkoro","Oyigbo","Port Harcourt","Tai"],
  "Kano": ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun Wada","Ungogo","Warawa","Wudil"],
  "Ogun": ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafemi Owode","Odeda","Odogbolu","Ogun Waterside","Remo North","Sagamu","Yewa North","Yewa South"],
  "Oyo": ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Iseyin","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona Ara","Orelope","Orire","Oyo East","Oyo West","Saki East","Saki West","Surulere"],
  "Abuja": ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal"],
};

// ── Types ─────────────────────────────────────────────────────────────────

interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  lga: string;
  postcode: string;
  country: string;
  countryCode: string;
}

interface SavedAddress {
  _key: string; label: string; isDefault: boolean;
  name: string; line1: string; line2: string;
  city: string; state: string; lga: string;
  postcode: string; country: string; countryCode: string;
}

interface NegotiatedDeal {
  productId: string;
  productSlug: string;
  agreedPrice: number;
  originalPrice: number;
  productName: string;
  variants: string;
}

// ── Styles ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 text-sm text-zinc-900 dark:text-[#f1f1f1] placeholder-zinc-400 dark:placeholder-[#555] focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-colors";

const selectClass =
  "w-full appearance-none rounded-lg border border-zinc-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] px-3 py-2.5 pr-9 text-sm text-zinc-900 dark:text-[#f1f1f1] focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-colors cursor-pointer";

const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

// ── Component ─────────────────────────────────────────────────────────────

export function CheckoutClient() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const cartItems = useCartItems();
  const totalPrice = useTotalPrice();
  const totalItems = useTotalItems();
  const { clearCart } = useCartActions();
  const { formatInCurrency } = useCurrency();

  // ── Negotiated deal from URL ──────────────────────────────────────────
  const negotiated = searchParams.get("negotiated") === "true";
  const [deal, setDeal] = useState<NegotiatedDeal | null>(null);
  const [dealProduct, setDealProduct] = useState<{ name: string; image?: string } | null>(null);
  const [dealLoading, setDealLoading] = useState(false);

  useEffect(() => {
    if (!negotiated) return;
    const productId = searchParams.get("productId") ?? "";
    const productSlug = searchParams.get("productSlug") ?? "";
    const agreedPrice = Number(searchParams.get("agreedPrice") ?? 0);
    const originalPrice = Number(searchParams.get("originalPrice") ?? 0);
    const variants = searchParams.get("variants") ?? "";
    if (!productId || !agreedPrice) return;

    setDeal({ productId, productSlug, agreedPrice, originalPrice, productName: "", variants });

    setDealLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(productSlug)}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const p = data?.products?.[0];
        if (p) {
          setDeal((prev) => prev ? { ...prev, productName: p.name ?? "" } : prev);
          setDealProduct({ name: p.name, image: p.imageUrl });
        }
      })
      .catch(() => {})
      .finally(() => setDealLoading(false));
  }, [negotiated, searchParams]);

  const items = negotiated && deal
    ? [{ productId: deal.productId, name: deal.productName || "Negotiated Product", price: deal.agreedPrice, quantity: 1 }]
    : cartItems;

  const subtotal = negotiated && deal ? deal.agreedPrice : totalPrice;
  const itemCount = negotiated && deal ? 1 : totalItems;

  const { stockMap, isLoading, hasStockIssues } = useCartStock(negotiated ? [] : cartItems);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [isCryptoLoading, setIsCryptoLoading] = useState(false);
  const [isPayingNegotiated, setIsPayingNegotiated] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddr, setSelectedSavedAddr] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    name: "", phone: "", line1: "", line2: "", city: "", state: "", lga: "",
    postcode: "", country: "Nigeria", countryCode: "NG",
  });

  const addressInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch countries ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((r) => r.json())
      .then((data: { name: { common: string }; cca2: string }[]) => {
        const sorted = data
          .map((c) => ({ code: c.cca2, name: c.name.common }))
          .sort((a, b) => {
            if (a.code === "NG") return -1;
            if (b.code === "NG") return 1;
            return a.name.localeCompare(b.name);
          });
        setCountries(sorted);
      })
      .catch(() => {
        setCountries([
          { code: "NG", name: "Nigeria" }, { code: "GH", name: "Ghana" },
          { code: "KE", name: "Kenya" }, { code: "ZA", name: "South Africa" },
          { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
          { code: "CA", name: "Canada" }, { code: "AE", name: "United Arab Emirates" },
        ]);
      })
      .finally(() => setCountriesLoading(false));
  }, []);

  // ── Fetch saved addresses ─────────────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/customer/addresses")
      .then((r) => r.json())
      .then((data) => {
        if (data.addresses?.length > 0) {
          setSavedAddresses(data.addresses);
          const def = data.addresses.find((a: SavedAddress) => a.isDefault) ?? data.addresses[0];
          if (def) applyAddress(def);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // ── Google Places Autocomplete ────────────────────────────────────────
  useEffect(() => {
    const input = addressInputRef.current;
    if (!input || typeof window === "undefined") return;
    const init = () => {
      if (!(window as any).google?.maps?.places) return;
      const autocomplete = new (window as any).google.maps.places.Autocomplete(input, {
        types: ["address"],
        fields: ["address_components"],
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;
        const get = (type: string) =>
          place.address_components.find((c: any) => c.types.includes(type))?.long_name ?? "";
        const getShort = (type: string) =>
          place.address_components.find((c: any) => c.types.includes(type))?.short_name ?? "";
        const streetNumber = get("street_number");
        const route = get("route");
        setAddress((a) => ({
          ...a,
          line1: [streetNumber, route].filter(Boolean).join(" ") || a.line1,
          city: get("locality") || get("postal_town") || get("administrative_area_level_2") || a.city,
          state: get("administrative_area_level_1") || a.state,
          postcode: get("postal_code") || a.postcode,
          country: get("country") || a.country,
          countryCode: getShort("country") || a.countryCode,
          lga: "",
        }));
        setSelectedShipping(null);
      });
    };
    if ((window as any).google?.maps?.places) {
      init();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.maps?.places) { clearInterval(interval); init(); }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const shippingFee = selectedShipping?.price ?? 0;
  const shippingMethod = selectedShipping?.method ?? "";
  const grandTotal = subtotal + shippingFee;
  const lgaOptions = address.countryCode === "NG" && address.state ? NIGERIA_LGAS[address.state] ?? [] : [];

  const isAddressComplete =
    address.name.trim() !== "" &&
    address.phone.trim() !== "" &&
    address.line1.trim() !== "" &&
    address.city.trim() !== "" &&
    address.postcode.trim() !== "" &&
    address.country.trim() !== "" &&
    !!selectedShipping;

  function handleCountryChange(code: string) {
    const country = countries.find((c) => c.code === code);
    setAddress((a) => ({ ...a, countryCode: code, country: country?.name ?? code, state: "", lga: "" }));
    setSelectedShipping(null);
  }

  function handleCityChange(city: string) {
    setAddress((a) => ({ ...a, city }));
    setSelectedShipping(null);
  }

  async function handleCryptoCheckout() {
    if (!isSignedIn) { setGuestModalOpen(true); return; }
    if (!isAddressComplete || hasStockIssues || isLoading) return;
    setIsCryptoLoading(true);
    try {
      sessionStorage.setItem("lastCheckoutAddress", JSON.stringify(address));
      const result = await createCryptoCheckoutSession(cartItems, address);
      if (result.success && result.url) { clearCart(); window.location.href = result.url; }
      else toast.error(result.error ?? "Could not start crypto payment");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsCryptoLoading(false); }
  }

  // ── Negotiated deal payment ───────────────────────────────────────────
  async function handleNegotiatedPayment() {
    if (!isSignedIn) { setGuestModalOpen(true); return; }
    if (!deal || !isAddressComplete) return;
    setIsPayingNegotiated(true);
    try {
      const res = await fetch("/api/negotiate/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: deal.productId,
          agreedPrice: deal.agreedPrice,
          originalPrice: deal.originalPrice,
          productName: deal.productName || dealProduct?.name || "Product",
          selectedVariants: deal.variants
            ? deal.variants.split("|").map((v) => { const [type, label] = v.split(":"); return { type, label }; })
            : [],
          shippingAddress: address,
          shippingMethod,
          shippingFee,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Payment failed");
      sessionStorage.setItem("lastCheckoutAddress", JSON.stringify(address));
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPayingNegotiated(false);
    }
  }

  // ── Apply a saved address ─────────────────────────────────────────────
  function applyAddress(addr: SavedAddress) {
    setAddress({
      name: addr.name, phone: "", line1: addr.line1, line2: addr.line2 ?? "",
      city: addr.city, state: addr.state ?? "", lga: addr.lga ?? "",
      postcode: addr.postcode, country: addr.country, countryCode: addr.countryCode,
    });
    setSelectedSavedAddr(addr._key);
    setSelectedShipping(null);
  }

  // ── Empty cart ────────────────────────────────────────────────────────
  if (!negotiated && items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <ShoppingBagIcon className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Your cart is empty</h1>
          <p className="mt-2 text-zinc-500 dark:text-[#a3a3a3]">Add some items before checking out.</p>
          <Button asChild className="mt-8 bg-brand-500 text-white hover:bg-brand-400 font-bold">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`}
        />
      )}

      <GuestCheckoutModal isOpen={guestModalOpen} onClose={() => setGuestModalOpen(false)} itemCount={itemCount} />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href={negotiated && deal ? `/products/${deal.productSlug}` : "/"}
            className="inline-flex items-center text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {negotiated ? "Back to Product" : "Continue Shopping"}
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Checkout</h1>

          {negotiated && deal && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-400/40 bg-brand-500/8 px-4 py-3">
              <CheckBadgeIcon className="h-5 w-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-700 dark:text-brand-400">
                  🤝 Negotiated Deal — {formatInCurrency(deal.agreedPrice)}
                </p>
                <p className="text-xs text-brand-600/80 dark:text-brand-500/80">
                  You saved {formatInCurrency(deal.originalPrice - deal.agreedPrice)} off the listed price of {formatInCurrency(deal.originalPrice)}
                </p>
              </div>
            </div>
          )}

          {isLoaded && !isSignedIn && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-brand-500/8 px-4 py-3">
              <p className="text-sm text-brand-700 dark:text-brand-300">
                <span className="font-semibold">Sign in required</span> — you need an account to complete your purchase.
              </p>
              <Button size="sm" onClick={() => setGuestModalOpen(true)}
                className="shrink-0 bg-brand-500 text-white hover:bg-brand-400 font-bold h-8 px-3 text-xs">
                Sign In
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-6 lg:grid lg:grid-cols-5 lg:gap-8">

          {/* ── Left ── */}
          <div className="space-y-5 lg:col-span-3">

            {/* Order summary */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
              <div className="border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-3.5">
                <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                  Order Summary ({itemCount} {itemCount === 1 ? "item" : "items"})
                </h2>
              </div>

              {negotiated && deal && (
                <div className="flex gap-3 px-5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]">
                    {dealProduct?.image
                      ? <Image src={dealProduct.image} alt={dealProduct.name ?? ""} fill className="object-cover" sizes="64px" />
                      : <div className="flex h-full items-center justify-center">
                          {dealLoading ? <Spinner className="w-4 h-4 text-zinc-300" /> : <span className="text-xs text-zinc-400">No img</span>}
                        </div>
                    }
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-[#f1f1f1] line-clamp-2">
                      {deal.productName || dealProduct?.name || "Loading…"}
                    </p>
                    <p className="text-xs text-zinc-500">Qty: 1 · Negotiated price</p>
                    {deal.variants && (
                      <p className="text-xs text-zinc-400">{deal.variants.split("|").map((v) => v.split(":")[1]).join(", ")}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-green-600 dark:text-green-400">{formatInCurrency(deal.agreedPrice)}</p>
                    <p className="text-xs line-through text-zinc-400">{formatInCurrency(deal.originalPrice)}</p>
                  </div>
                </div>
              )}

              {!negotiated && (
                <>
                  {hasStockIssues && !isLoading && (
                    <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-brand-200 dark:border-brand-800/50 bg-brand-50 dark:bg-brand-950/30 px-4 py-3 text-sm text-brand-800 dark:text-brand-300">
                      <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                      <span>Some items have stock issues. Please update your cart.</span>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-center justify-center py-6">
                      <Spinner className="h-5 w-5 text-zinc-400" />
                      <span className="ml-2 text-sm text-zinc-500 dark:text-[#a3a3a3]">Verifying stock...</span>
                    </div>
                  )}
                  <div className="divide-y divide-zinc-100 dark:divide-[#1a1a1a]">
                    {cartItems.map((item) => {
                      const stockInfo = stockMap.get(item.productId);
                      const hasIssue = stockInfo?.isOutOfStock || stockInfo?.exceedsStock;
                      return (
                        <div key={item.productId} className={`flex gap-3 px-5 py-4 ${hasIssue ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#0d0d0d]">
                            {item.image
                              ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                              : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No image</div>
                            }
                          </div>
                          <div className="flex flex-1 flex-col justify-between min-w-0">
                            <p className="font-medium text-sm text-zinc-900 dark:text-[#f1f1f1] line-clamp-2">{item.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">Qty: {item.quantity}</p>
                            {stockInfo?.isOutOfStock && <p className="text-xs font-medium text-red-600 dark:text-red-400">Out of stock</p>}
                            {stockInfo?.exceedsStock && !stockInfo.isOutOfStock && (
                              <p className="text-xs font-medium text-brand-600 dark:text-brand-400">Only {stockInfo.currentStock} available</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-sm text-zinc-900 dark:text-brand-400">{formatInCurrency(item.price * item.quantity)}</p>
                            {item.quantity > 1 && <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{formatInCurrency(item.price)} each</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Address form */}
            <div className="rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
              <div className="border-b border-zinc-100 dark:border-[#1a1a1a] px-5 py-3.5">
                <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Shipping Address</h2>
              </div>
              <div className="space-y-4 px-5 py-4">

                {/* Saved addresses */}
                {isSignedIn && savedAddresses.length > 0 && (
                  <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2.5 uppercase tracking-wide">
                      Your saved addresses
                    </p>
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <button key={addr._key} type="button" onClick={() => applyAddress(addr)}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all duration-150 ${
                            selectedSavedAddr === addr._key
                              ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-1 ring-brand-500/30"
                              : "border-zinc-200 dark:border-zinc-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {addr.isDefault && <span className="text-brand-500 mr-1">⭐</span>}
                              {addr.label}
                            </span>
                            {selectedSavedAddr === addr._key && (
                              <CheckBadgeIcon className="h-4 w-4 text-brand-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-zinc-500 dark:text-zinc-400 mt-0.5 text-xs truncate">
                            {addr.line1}{addr.city ? `, ${addr.city}` : ""}{addr.postcode ? ` ${addr.postcode}` : ""}
                          </p>
                        </button>
                      ))}
                      <button type="button"
                        onClick={() => {
                          setSelectedSavedAddr(null);
                          setAddress({ name: "", phone: "", line1: "", line2: "", city: "", state: "", lga: "", postcode: "", country: "Nigeria", countryCode: "NG" });
                        }}
                        className="w-full text-left rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm text-zinc-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all">
                        + Use a different address
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label htmlFor="checkout-name" className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <input id="checkout-name" type="text" value={address.name}
                    onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                    placeholder="John Doe" className={inputClass} />
                </div>

                {/* ── Phone Number ── */}
                <div>
                  <label htmlFor="checkout-phone" className={labelClass}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className={inputClass}
                  />
                </div>

                {/* Street address */}
                <div>
                  <label htmlFor="checkout-address-line1" className={labelClass}>
                    Street Address <span className="text-red-500">*</span>
                    <span className="ml-2 text-[10px] font-normal text-brand-500">✦ smart suggestions enabled</span>
                  </label>
                  <input
                    id="checkout-address-line1"
                    ref={addressInputRef}
                    type="text"
                    value={address.line1}
                    onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                    placeholder="Start typing your street address…"
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-address-line2" className={labelClass}>Address Line 2 <span className="text-zinc-400 text-xs">(optional)</span></label>
                  <input id="checkout-address-line2" type="text" value={address.line2}
                    onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                    placeholder="Apartment, floor, landmark" className={inputClass} />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="checkout-country" className={labelClass}>Country <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select id="checkout-country" value={address.countryCode} onChange={(e) => handleCountryChange(e.target.value)} className={selectClass}>
                      {countriesLoading
                        ? <option>Loading countries…</option>
                        : countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)
                      }
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label htmlFor="checkout-state" className={labelClass}>State / Region <span className="text-red-500">*</span></label>
                  <input id="checkout-state" type="text" value={address.state}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value, lga: "" }))}
                    placeholder="Lagos" className={inputClass} />
                </div>

                {/* LGA — Nigeria only */}
                {address.countryCode === "NG" && lgaOptions.length > 0 && (
                  <div>
                    <label htmlFor="checkout-lga" className={labelClass}>LGA (Local Government Area)</label>
                    <div className="relative">
                      <select id="checkout-lga" value={address.lga}
                        onChange={(e) => setAddress((a) => ({ ...a, lga: e.target.value }))}
                        className={selectClass}>
                        <option value="">Select LGA…</option>
                        {lgaOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                )}

                {/* City + Postcode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="checkout-city" className={labelClass}>City <span className="text-red-500">*</span></label>
                    <input id="checkout-city" type="text" value={address.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="Lagos" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="checkout-postcode" className={labelClass}>Postcode <span className="text-red-500">*</span></label>
                    <input id="checkout-postcode" type="text" value={address.postcode}
                      onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value }))}
                      placeholder="100001" className={inputClass} />
                  </div>
                </div>

                {/* Shipping calculator */}
                {(address.city || address.state) && address.country && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-[#1a1a1a]">
                    <span className={`${labelClass} mb-3 block`}>Shipping Method <span className="text-red-500">*</span></span>
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
                  <span className="text-zinc-500 dark:text-[#a3a3a3]">{negotiated ? "Negotiated price" : "Subtotal"}</span>
                  <span className="text-zinc-900 dark:text-[#f1f1f1]">{formatInCurrency(subtotal)}</span>
                </div>
                {negotiated && deal && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Listed price</span>
                    <span className="line-through text-zinc-400">{formatInCurrency(deal.originalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-[#a3a3a3]">Shipping</span>
                  {selectedShipping
                    ? <span className={shippingFee === 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-zinc-900 dark:text-[#f1f1f1]"}>
                        {shippingFee === 0 ? "Free" : formatInCurrency(shippingFee)}
                      </span>
                    : <span className="text-xs text-zinc-400">Select method below</span>
                  }
                </div>
                {selectedShipping && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">via {selectedShipping.carrier}</span>
                    <span className="text-zinc-400">{selectedShipping.estimatedDays}</span>
                  </div>
                )}
                <div className="border-t border-zinc-100 dark:border-[#1a1a1a] pt-2 flex justify-between font-bold text-base">
                  <span className="text-zinc-900 dark:text-[#f1f1f1]">Total</span>
                  <span className="text-zinc-900 dark:text-brand-400">{formatInCurrency(grandTotal)}</span>
                </div>
              </div>

              {!negotiated && (
                <div className="border-t border-zinc-100 dark:border-[#1a1a1a] pt-4">
                  <PaymentMethodSelector selected={paymentMethod} onChange={setPaymentMethod} />
                </div>
              )}

              <div className="pt-1">
                {negotiated ? (
                  !isSignedIn ? (
                    <Button onClick={() => setGuestModalOpen(true)}
                      className="w-full h-12 bg-brand-500 text-white hover:bg-brand-400 font-bold shadow-lg shadow-brand-500/20">
                      Sign In to Pay
                    </Button>
                  ) : (
                    <Button onClick={handleNegotiatedPayment}
                      disabled={!isAddressComplete || isPayingNegotiated}
                      className="w-full h-12 bg-brand-500 text-white hover:bg-brand-400 font-bold shadow-lg shadow-brand-500/20 disabled:opacity-50">
                      {isPayingNegotiated
                        ? <><Spinner className="h-4 w-4 text-white mr-2" /> Setting up payment…</>
                        : `Pay ${formatInCurrency(grandTotal)}`
                      }
                    </Button>
                  )
                ) : paymentMethod === "paystack" ? (
                  !isSignedIn ? (
                    <Button onClick={() => setGuestModalOpen(true)}
                      className="w-full h-12 bg-brand-500 text-white hover:bg-brand-400 font-bold shadow-lg shadow-brand-500/20">
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
                    className="w-full h-12 gap-2 bg-linear-to-r from-brand-500 to-brand-500 text-white font-bold disabled:opacity-50"
                    disabled={hasStockIssues || isLoading || !isAddressComplete || isCryptoLoading}
                    onClick={handleCryptoCheckout}>
                    {isCryptoLoading ? <><Spinner className="h-4 w-4" /> Preparing...</> : "Pay with Crypto"}
                  </Button>
                )}
              </div>

              {!isAddressComplete && isSignedIn && (
                <p className="text-center text-xs text-brand-600 dark:text-brand-400">
                  {!selectedShipping ? "↓ Select a shipping method to continue" : "↓ Fill in your shipping address to continue"}
                </p>
              )}

              <p className="text-center text-xs text-zinc-400 dark:text-[#555]">Secure checkout via Paystack</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}