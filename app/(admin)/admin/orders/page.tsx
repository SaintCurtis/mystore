"use client";

import { Suspense, useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  OrderRow,
  OrderRowSkeleton,
  AdminSearch,
  useOrderSearchFilter,
  OrderTableHeader,
} from "@/components/admin";
import { ORDER_STATUS_TABS } from "@/lib/constants/orderStatus";
import { writeClient } from "@/sanity/lib/client";

interface OrderListContentProps {
  statusFilter: string;
  searchFilter?: string;
}

function OrderListContent({ statusFilter, searchFilter }: OrderListContentProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchOrders = async (lastId?: string) => {
    setIsLoadingMore(true);

    let query = `*[_type == "order"`;

    const conditions: string[] = [];

    if (statusFilter !== "all") {
      conditions.push(`status == "${statusFilter}"`);
    }
    if (searchFilter) {
      conditions.push(`(${searchFilter})`);
    }

    if (conditions.length > 0) {
      query += ` && ${conditions.join(" && ")}`;
    }

    query += `] | order(_createdAt desc)`;

    // Add cursor-based pagination
    if (lastId) {
      query += ` [_id > $lastId][0...20]`;
    } else {
      query += ` [0...20]`;
    }

    const result = await writeClient.fetch(query, lastId ? { lastId } : {});

    if (lastId) {
      setOrders((prev) => [...prev, ...result]);
    } else {
      setOrders(result);
    }

    setHasMore(result.length === 20);
    setIsLoadingMore(false);
  };

  // Fetch when filters change
  useEffect(() => {
    setOrders([]);           // Reset list when filter changes
    setHasMore(true);
    fetchOrders();
  }, [statusFilter, searchFilter]);

  if (orders.length === 0) {
    const description = searchFilter
      ? "Try adjusting your search terms."
      : statusFilter === "all"
        ? "Orders will appear here when customers make purchases."
        : `No ${statusFilter} orders at the moment.`;

    return (
      <EmptyState
        icon={ShoppingCart}
        title="No orders found"
        description={description}
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <OrderTableHeader />
          <TableBody>
            {orders.map((order) => (
              <OrderRow
                key={order._id}
                order={order}           // ← Updated prop name
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              const lastId = orders[orders.length - 1]._id;
              fetchOrders(lastId);
            }}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}

function OrderListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <OrderTableHeader />
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { filter: searchFilter, isSearching } = useOrderSearchFilter(searchQuery);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Manage and track customer orders
        </p>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col gap-4">
        <AdminSearch
          placeholder="Search by order # or email..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full sm:max-w-xs"
        />

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-max">
              {ORDER_STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Order List */}
      {isSearching ? (
        <OrderListSkeleton />
      ) : (
        <Suspense
          key={`${statusFilter}-${searchFilter ?? ""}`}
          fallback={<OrderListSkeleton />}
        >
          <OrderListContent
            statusFilter={statusFilter}
            searchFilter={searchFilter}
          />
        </Suspense>
      )}
    </div>
  );
}