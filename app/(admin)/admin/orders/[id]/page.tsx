"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, CreditCard, ExternalLink, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusSelect,
  AddressEditor,
} from "@/components/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import { writeClient } from "@/sanity/lib/client";

interface OrderData {
  _id: string;
  orderNumber: string;
  email: string;
  total: number;
  status: string;
  createdAt: string;
  stripePaymentId?: string | null;
  address?: {
    name?: string;
    line1?: string;
    line2?: string | null;     // ← Must allow null
    city?: string;
    postcode?: string;
    country?: string;
  } | null;
  items: Array<{
    _key: string;
    quantity: number;
    priceAtPurchase: number;
    product?: {
      _id: string;
      name: string;
      slug?: string;
      image?: {
        asset?: { url?: string } | null;
      } | null;
    } | null;
  }>;
}

function OrderDetailContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const data = await writeClient.fetch<OrderData>(`
          *[_type == "order" && _id == $id][0] {
            _id,
            orderNumber,
            email,
            total,
            status,
            createdAt,
            stripePaymentId,
            address {
              name, line1, line2, city, postcode, country
            },
            items[] {
              _key,
              quantity,
              priceAtPurchase,
              product -> {
                _id,
                name,
                "slug": slug.current,
                "image": images[0] {
                  asset -> { url }
                }
              }
            }
          }
        `, { id: orderId });

        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(order.createdAt, "datetime")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Status:</span>
          <StatusSelect 
            documentId={order._id} 
            initialStatus={order.status} 
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* Order Items */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({order.items?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items?.map((item) => (
                <div
                  key={item._key}
                  className="flex gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:h-20 sm:w-20">
                    {item.product?.image?.asset?.url ? (
                      <Image
                        src={item.product.image.asset.url}
                        alt={item.product.name ?? "Product"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-base">
                          {item.product?.name ?? "Unknown Product"}
                        </span>
                        {item.product?.slug && (
                          <Link
                            href={`/products/${item.product.slug}`}
                            target="_blank"
                            className="shrink-0 text-zinc-400 hover:text-zinc-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                        Qty: {item.quantity} × {formatPrice(item.priceAtPurchase)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-base">
                      {formatPrice((item.priceAtPurchase ?? 0) * (item.quantity ?? 1))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Order Summary</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatPrice(order.total)}</span>
              </div>
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Customer</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="break-all text-zinc-900 dark:text-zinc-100">{order.email}</p>
              {order.stripePaymentId && (
                <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">
                  Payment: {order.stripePaymentId}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Shipping Address</h2>
              </div>
              <Edit2 className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-4">
              <AddressEditor 
                documentId={order._id} 
                initialAddress={order.address} 
              />
            </div>
          </div>

          {/* Studio Link */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Advanced Editing</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              For additional changes, edit this order in Sanity Studio.
            </p>
            <Link
              href={`/studio/structure/order;${order._id}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              Open in Studio
              <ExternalLink className="h-3.5 w-3.5" />
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
        <div>
          <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = React.use(params);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent orderId={id} />
      </Suspense>
    </div>
  );
}