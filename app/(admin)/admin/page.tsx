import { sanityFetch } from "@/sanity/lib/live";
import { groq } from "next-sanity";
import Link from "next/link";
import {
  Package, ShoppingCart, AlertTriangle, TrendingUp,
  ArrowRight, CheckCircle, Clock, XCircle,
} from "lucide-react";

// ── Quick queries (local to this page — not exported, no conflict with orders.ts) ──

const ADMIN_STATS_QUERY = groq`{
  "totalProducts": count(*[_type == "product"]),
  "inStock": count(*[_type == "product" && stock > 0]),
  "outOfStock": count(*[_type == "product" && stock == 0]),
  "featured": count(*[_type == "product" && featured == true]),
  "totalOrders": count(*[_type == "order"]),
  "pendingOrders": count(*[_type == "order" && status == "pending"]),
  "completedOrders": count(*[_type == "order" && status == "completed"]),
  "totalCategories": count(*[_type == "category"]),
}`;

// Renamed from RECENT_ORDERS_QUERY → ADMIN_RECENT_ORDERS_QUERY to avoid
// duplicate with the exported RECENT_ORDERS_QUERY in lib/sanity/queries/orders.ts
const ADMIN_RECENT_ORDERS_QUERY = groq`*[_type == "order"] | order(_createdAt desc) [0...8] {
  _id,
  _createdAt,
  orderNumber,
  status,
  totalAmount,
  "customerName": customer->name,
  "customerEmail": customer->email,
}`;

const LOW_STOCK_QUERY = groq`*[_type == "product" && stock > 0 && stock <= 3] | order(stock asc) [0...8] {
  _id,
  name,
  stock,
  price,
  "slug": slug.current,
  "category": category->title,
}`;

// ── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending:   { label: "Pending",   className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",        icon: <Clock className="h-3 w-3" /> },
    completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle className="h-3 w-3" /> },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",                icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] ?? map["pending"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const [{ data: stats }, { data: recentOrders }, { data: lowStock }] =
    await Promise.all([
      sanityFetch({ query: ADMIN_STATS_QUERY }),
      sanityFetch({ query: ADMIN_RECENT_ORDERS_QUERY }),  // ← updated
      sanityFetch({ query: LOW_STOCK_QUERY }),
    ]);

  const s = stats as {
    totalProducts: number; inStock: number; outOfStock: number;
    featured: number; totalOrders: number; pendingOrders: number;
    completedOrders: number; totalCategories: number;
  };

  return (
    <div className="space-y-8">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back — here's what's happening in your store.
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Products", value: s?.totalProducts ?? 0, icon: Package,       color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20"     },
          { label: "In Stock",       value: s?.inStock ?? 0,       icon: CheckCircle,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Out of Stock",   value: s?.outOfStock ?? 0,    icon: AlertTriangle, color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20"       },
          { label: "Total Orders",   value: s?.totalOrders ?? 0,   icon: ShoppingCart,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20"   },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Pending Orders",    value: s?.pendingOrders ?? 0   },
          { label: "Completed Orders",  value: s?.completedOrders ?? 0 },
          { label: "Featured Products", value: s?.featured ?? 0        },
          { label: "Categories",        value: s?.totalCategories ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Recent Orders ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!recentOrders || (recentOrders as any[]).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">No orders yet</p>
            ) : (
              (recentOrders as any[]).map((order) => (
                <div key={order._id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {order.customerName ?? order.customerEmail ?? "Guest"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {order.orderNumber ?? order._id.slice(-8)}
                      {" · "}
                      {new Date(order._createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {order.totalAmount && (
                      <span className="text-sm font-semibold text-zinc-900 dark:text-amber-400">
                        ₦{Number(order.totalAmount).toLocaleString()}
                      </span>
                    )}
                    <StatusBadge status={order.status ?? "pending"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Low Stock Alert ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock (≤3 units)
            </h2>
            <Link href="/admin/inventory" className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {!lowStock || (lowStock as any[]).length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-400">
                ✅ All products are well stocked
              </p>
            ) : (
              (lowStock as any[]).map((product) => (
                <div key={product._id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{product.name}</p>
                    <p className="text-xs text-zinc-400">{product.category ?? "Uncategorised"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      product.stock === 1
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Add Product",    href: "/studio/structure/products", icon: Package,      desc: "via Sanity Studio" },
            { label: "View Inventory", href: "/admin/inventory",            icon: TrendingUp,   desc: "Manage stock"      },
            { label: "View Orders",    href: "/admin/orders",               icon: ShoppingCart, desc: "Process orders"    },
            { label: "Open Studio",    href: "/studio",                     icon: ArrowRight,   desc: "Full CMS"          },
          ].map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={label}
              href={href}
              target={href.startsWith("/studio") ? "_blank" : undefined}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all hover:border-amber-500/50 hover:shadow-md dark:hover:border-amber-500/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}