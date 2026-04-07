import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowLeft, CreditCard, MapPin, CheckCircle2,
  Truck, XCircle, MessageCircle, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sanityFetch } from "@/sanity/lib/live";
import { ORDER_BY_ID_QUERY } from "@/lib/sanity/queries/orders";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Order Details | The Saint's TechNet",
  description: "View your order details and tracking",
};

interface OrderItem {
  _key: string;
  quantity?: number;
  priceAtPurchase?: number;
  product?: { name?: string; slug?: string; image?: { asset?: { url?: string } } };
}
interface OrderAddress {
  name?: string; line1?: string; line2?: string;
  city?: string; postcode?: string; country?: string;
}
interface Order {
  orderNumber: string; clerkUserId: string; createdAt: string;
  status: string; total: number; email?: string;
  items?: OrderItem[]; address?: OrderAddress; paystackReference?: string;
}

// ── Timeline config ──────────────────────────────────────────────
const STEPS = [
  { key: "paid",      label: "Payment Confirmed", sub: "Payment received and verified",        icon: CreditCard,    activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-100 dark:bg-emerald-500/15", activeBorder: "border-emerald-300 dark:border-emerald-500/40" },
  { key: "processing",label: "Processing",        sub: "Verifying and packing your order",     icon: Clock,         activeColor: "text-amber-600 dark:text-amber-400",   activeBg: "bg-amber-100 dark:bg-amber-500/15",   activeBorder: "border-amber-300 dark:border-amber-500/40"   },
  { key: "shipped",   label: "Shipped",           sub: "Your order is on its way",             icon: Truck,         activeColor: "text-blue-600 dark:text-blue-400",     activeBg: "bg-blue-100 dark:bg-blue-500/15",     activeBorder: "border-blue-300 dark:border-blue-500/40"     },
  { key: "delivered", label: "Delivered",         sub: "Order delivered successfully! 🎉",     icon: CheckCircle2,  activeColor: "text-emerald-600 dark:text-emerald-400", activeBg: "bg-emerald-100 dark:bg-emerald-500/15", activeBorder: "border-emerald-300 dark:border-emerald-500/40" },
];

function getActiveStep(status: string) {
  switch (status) {
    case "paid":      return 0;
    case "shipped":   return 2;
    case "delivered": return 3;
    default:          return 0;
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();

  const { data: order } = await sanityFetch({ query: ORDER_BY_ID_QUERY, params: { id } }) as { data: Order | null };
  if (!order || order.clerkUserId !== userId) notFound();

  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;
  const isCancelled = order.status === "cancelled";
  const activeStep = getActiveStep(order.status);

  const whatsappMsg = encodeURIComponent(
    `Hi! I'd like to track my order:\n\n*Order #${order.orderNumber}*\nPlaced: ${formatDate(order.createdAt)}\nTotal: ${formatPrice(order.total)}\n\nCould you give me an update? Thank you!`
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-[#a3a3a3] hover:text-zinc-900 dark:hover:text-[#f1f1f1] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#f1f1f1]">Order {order.orderNumber}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-[#a3a3a3]">Placed on {formatDate(order.createdAt, "datetime")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={`https://wa.me/2349060898951?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/8 px-3 py-2 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/15 transition-all">
                <MessageCircle className="h-4 w-4" /> Track via WhatsApp
              </a>
              <Badge className={`${status.color} flex items-center gap-1.5 px-3 py-1.5`}>
                <StatusIcon className="h-3.5 w-3.5" /> {status.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Visual Timeline */}
        {!isCancelled ? (
          <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-6 transition-colors">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-[#555]">Order Progress</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-10 h-[calc(100%-48px)] w-0.5 bg-zinc-100 dark:bg-[#1f1f1f]" />
              <div className="space-y-5">
                {STEPS.map((step, i) => {
                  const done = i <= activeStep;
                  const current = i === activeStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="relative flex items-start gap-4">
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${done ? `${step.activeBg} ${step.activeBorder}` : "bg-zinc-50 dark:bg-[#0d0d0d] border-zinc-200 dark:border-[#2a2a2a]"}`}>
                        <Icon className={`h-4 w-4 ${done ? step.activeColor : "text-zinc-300 dark:text-[#333]"}`} />
                        {current && <span className="absolute -inset-1.5 rounded-full animate-ping opacity-20 bg-amber-400" />}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold ${done ? "text-zinc-900 dark:text-[#f1f1f1]" : "text-zinc-400 dark:text-[#444]"}`}>
                            {step.label}
                            {current && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                Current
                              </span>
                            )}
                          </p>
                          {done && current && (
                            <span className="shrink-0 text-xs text-zinc-400 dark:text-[#555]">{formatDate(order.createdAt)}</span>
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs ${done ? "text-zinc-500 dark:text-[#a3a3a3]" : "text-zinc-300 dark:text-[#333]"}`}>{step.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/8 p-5">
            <XCircle className="h-6 w-6 shrink-0 text-red-500 dark:text-red-400" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-0.5">Chat with us on WhatsApp if you have questions.</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Items */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] overflow-hidden">
              <div className="border-b border-zinc-100 dark:border-[#1a1a1a] px-6 py-4">
                <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Items ({order.items?.length ?? 0})</h2>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-[#1a1a1a]">
                {order.items?.map((item) => (
                  <div key={item._key} className="flex gap-4 px-6 py-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-[#0d0d0d]">
                      {item.product?.image?.asset?.url
                        ? <Image src={item.product.image.asset.url} alt={item.product.name ?? ""} fill className="object-cover" sizes="80px" />
                        : <div className="flex h-full items-center justify-center text-xs text-zinc-400">No image</div>}
                    </div>
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <Link href={`/products/${item.product?.slug}`} className="font-medium text-zinc-900 dark:text-[#f1f1f1] hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-2">
                        {item.product?.name ?? "Unknown Product"}
                      </Link>
                      <p className="text-sm text-zinc-500 dark:text-[#a3a3a3]">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-zinc-900 dark:text-amber-400">{formatPrice((item.priceAtPurchase ?? 0) * (item.quantity ?? 1))}</p>
                      {(item.quantity ?? 1) > 1 && <p className="text-xs text-zinc-500 dark:text-[#a3a3a3]">{formatPrice(item.priceAtPurchase ?? 0)} each</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-2">
            {/* Summary */}
            <div className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1] mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-[#a3a3a3]">Subtotal</span><span className="text-zinc-900 dark:text-[#f1f1f1]">{formatPrice(order.total)}</span></div>
                <div className="border-t border-zinc-100 dark:border-[#1a1a1a] pt-2 flex justify-between font-bold text-base">
                  <span className="text-zinc-900 dark:text-[#f1f1f1]">Total</span>
                  <span className="text-zinc-900 dark:text-amber-400">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            {order.address && (
              <div className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
                <div className="flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-zinc-400" /><h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Shipping Address</h2></div>
                <div className="text-sm text-zinc-600 dark:text-[#a3a3a3] space-y-0.5">
                  {order.address.name && <p className="font-medium text-zinc-800 dark:text-[#f1f1f1]">{order.address.name}</p>}
                  {order.address.line1 && <p>{order.address.line1}</p>}
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{[order.address.city, order.address.postcode].filter(Boolean).join(", ")}</p>
                  {order.address.country && <p>{order.address.country}</p>}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="rounded-2xl border border-zinc-200 dark:border-[#1a1a1a] bg-white dark:bg-[#111111] p-5">
              <div className="flex items-center gap-2 mb-3"><CreditCard className="h-4 w-4 text-zinc-400" /><h2 className="font-semibold text-zinc-900 dark:text-[#f1f1f1]">Payment</h2></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-[#a3a3a3]">Status</span><span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">{order.status}</span></div>
                {order.email && <div className="flex justify-between gap-2"><span className="text-zinc-500 dark:text-[#a3a3a3] shrink-0">Email</span><span className="text-zinc-800 dark:text-[#f1f1f1] truncate">{order.email}</span></div>}
              </div>
            </div>

            {/* Help */}
            <a href={`https://wa.me/2349060898951?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/25 bg-[#25D366]/8 px-4 py-3 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/15 transition-all">
              <MessageCircle className="h-4 w-4" /> Need help with this order?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}