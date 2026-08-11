// app/(admin)/admin/orders/[id]/page.tsx
// CHANGES: shows all new fields — buyerName, state, lga, shippingFee,
// shippingMethod, paystackReference, negotiated deal badge.
// Replaced all lucide icons with heroicons.

"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDocumentProjection, type DocumentHandle } from "@sanity/sdk-react";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CreditCardIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  TruckIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusSelect,
  AddressEditor,
  PublishButton,
  RevertButton,
} from "@/components/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import { SanityWrapper } from "@/components/providers/SanityWrapper";

interface OrderDetailProjection {
  orderNumber: string;
  email: string;
  buyerName: string | null;
  total: number;
  subtotal: number | null;
  shippingFee: number | null;
  shippingMethod: string | null;
  status: string;
  createdAt: string;
  paystackReference: string | null;
  isNegotiatedDeal: boolean | null;
  agreedPrice: number | null;
  originalPrice: number | null;
  savedAmount: number | null;
  address: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    lga: string | null;
    postcode: string;
    country: string;
  } | null;
  items: Array<{
    _key: string;
    quantity: number;
    priceAtPurchase: number;
    product: {
      _id: string;
      name: string;
      slug: string;
      image: { asset: { url: string } | null } | null;
    } | null;
  }>;
}

function OrderDetailContent({ handle }: { handle: DocumentHandle }) {
  const { data } = useDocumentProjection<OrderDetailProjection>({
    ...handle,
    projection: `{
      orderNumber, email, buyerName, total, subtotal, shippingFee, shippingMethod,
      status, createdAt, paystackReference, isNegotiatedDeal,
      agreedPrice, originalPrice, savedAmount,
      address{ name, line1, line2, city, state, lga, postcode, country },
      items[]{
        _key, quantity, priceAtPurchase,
        product->{ _id, name, "slug": slug.current, "image": images[0]{ asset->{ url } } }
      }
    }`,
  });

  if (!data) {
    return <div className="py-16 text-center"><p className="text-zinc-500">Order not found</p></div>;
  }

  const shippingFee = data.shippingFee ?? 0;
  const subtotal = data.subtotal ?? (data.total - shippingFee);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              Order {data.orderNumber}
            </h1>
            {data.isNegotiatedDeal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <CheckBadgeIcon className="h-3.5 w-3.5" /> Negotiated Deal
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(data.createdAt, "datetime")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Status:</span>
            <Suspense fallback={<Skeleton className="h-10 w-[140px]" />}>
              <StatusSelect {...handle} />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}><RevertButton {...handle} /></Suspense>
            <Suspense fallback={null}><PublishButton {...handle} /></Suspense>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* ── Left ── */}
        <div className="space-y-6 lg:col-span-3">

          {/* Items */}
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({data.items?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data.items?.map((item) => (
                <div key={item._key} className="flex gap-3 px-5 py-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {item.product?.image?.asset?.url
                      ? <Image src={item.product.image.asset.url} alt={item.product?.name ?? "Product"} fill className="object-cover" sizes="64px" />
                      : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No image</div>
                    }
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                        {item.product?.name ?? "Unknown Product"}
                      </span>
                      {item.product?.slug && (
                        <Link href={`/products/${item.product.slug}`} target="_blank"
                          className="shrink-0 text-zinc-400 hover:text-blue-500 transition-colors">
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Qty: {item.quantity} × {formatPrice(item.priceAtPurchase)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPrice((item.priceAtPurchase ?? 0) * (item.quantity ?? 1))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {data.isNegotiatedDeal ? "Negotiated price" : "Subtotal"}
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
              </div>
              {data.isNegotiatedDeal && data.originalPrice && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Listed price</span>
                  <span className="line-through text-zinc-400">{formatPrice(data.originalPrice)}</span>
                </div>
              )}
              {data.isNegotiatedDeal && data.savedAmount && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 dark:text-green-400">Customer saved</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">-{formatPrice(data.savedAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <TruckIcon className="h-3.5 w-3.5" />
                  Shipping {data.shippingMethod ? `(${data.shippingMethod})` : ""}
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between font-bold text-base">
                <span className="text-zinc-900 dark:text-zinc-100">Total</span>
                <span className="text-zinc-900 dark:text-blue-400">{formatPrice(data.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Customer */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-4">
              <CreditCardIcon className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Customer</h2>
            </div>
            <div className="space-y-1.5 text-sm">
              {data.buyerName && (
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{data.buyerName}</p>
              )}
              <p className="break-all text-zinc-600 dark:text-zinc-300">{data.email}</p>
              {data.paystackReference && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono break-all pt-1">
                  Ref: {data.paystackReference}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Shipping Address</h2>
              </div>
              <PencilSquareIcon className="h-4 w-4 text-zinc-400" />
            </div>

            {/* Display the real address clearly */}
            {data.address ? (
              <div className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300 mb-4">
                {data.address.name && <p className="font-semibold text-zinc-900 dark:text-zinc-100">{data.address.name}</p>}
                <p>{data.address.line1}</p>
                {data.address.line2 && <p>{data.address.line2}</p>}
                {data.address.lga && <p className="text-zinc-500">{data.address.lga}</p>}
                <p>{[data.address.city, data.address.state].filter(Boolean).join(", ")}</p>
                <p>{[data.address.postcode, data.address.country].filter(Boolean).join(" · ")}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 mb-4">No address recorded</p>
            )}

            {/* Editable via AddressEditor */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <p className="text-xs text-zinc-400 mb-3">Edit address:</p>
              <Suspense fallback={<div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>}>
                <AddressEditor {...handle} />
              </Suspense>
            </div>
          </div>

          {/* Studio link */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Advanced Editing</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Edit this order in Sanity Studio.</p>
            <Link
              href={`/studio/structure/order;${handle.documentId}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Open in Studio <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="mt-2 h-4 w-32" /></div>
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-64 rounded-xl" /><Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps { params: Promise<{ id: string }> }

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const handle: DocumentHandle = { documentId: id, documentType: "order" };
  return (
    <SanityWrapper>
      <div className="space-y-4 sm:space-y-6">
        <Link href="/admin/orders"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Orders
        </Link>
        <Suspense fallback={<OrderDetailSkeleton />}>
          <OrderDetailContent handle={handle} />
        </Suspense>
      </div>
    </SanityWrapper>
  );
}