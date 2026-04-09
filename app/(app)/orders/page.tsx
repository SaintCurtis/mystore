import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Package, ArrowRight, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { sanityFetch } from "@/sanity/lib/live";
import { ORDERS_BY_USER_QUERY } from "@/lib/sanity/queries/orders";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { formatPrice, formatDate, formatOrderNumber } from "@/lib/utils";
import { StackedProductImages } from "@/components/app/StackedProductImages";
import type { ORDERS_BY_USER_QUERYResult } from "@/sanity.types";

export const metadata = {
  title: "Your Orders | The Saint's TechNet",
  description: "Track and manage your orders",
};

export default async function OrdersPage() {
  const { userId } = await auth();

  const { data: orders } = (await sanityFetch({
    query: ORDERS_BY_USER_QUERY,
    params: { clerkUserId: userId ?? "" },
  })) as { data: ORDERS_BY_USER_QUERYResult };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order, it will appear here."
            action={{ label: "Start Shopping", href: "/" }}
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#f1f1f1]">
              Your Orders
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3]">
              Track and manage your orders
            </p>
          </div>
          <Link
            href="/build-my-setup"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/8 px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors"
          >
            <Wand2 className="h-4 w-4" />
            Build My Setup
          </Link>
        </div>

        <div className="space-y-4">
          {orders.map((order: ORDERS_BY_USER_QUERYResult[number]) => {
            const status = getOrderStatus(order.status);
            const StatusIcon = status.icon;
            const images = (order.itemImages ?? []).filter(
              (url): url is string => url !== null,
            );

            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="group block rounded-xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] transition-all hover:border-zinc-300 dark:hover:border-amber-500/20 hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              >
                <div className="flex gap-4 p-5">
                  <StackedProductImages
                    images={images}
                    totalCount={order.itemCount ?? 0}
                    size="lg"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">
                          Order #{formatOrderNumber(order.orderNumber)}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-[#a3a3a3]">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge className={`${status.color} shrink-0 flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </p>
                      <p className="text-lg font-semibold text-zinc-900 dark:text-amber-400">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-[#1a1a1a] px-5 py-3">
                  <p className="truncate text-sm text-zinc-500 dark:text-[#a3a3a3]">
                    {order.itemNames?.slice(0, 2).filter(Boolean).join(", ")}
                    {(order.itemNames?.length ?? 0) > 2 && "..."}
                  </p>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-500 dark:text-[#a3a3a3] transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    View order
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}