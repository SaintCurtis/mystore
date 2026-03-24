"use client";

import { Suspense, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody } from "@/components/ui/table";
import {
  ProductRow,
  ProductRowSkeleton,
  AdminSearch,
  useProductSearchFilter,
  ProductTableHeader,
} from "@/components/admin";
import { writeClient } from "@/sanity/lib/client";

function ProductListContent({
  filter,
  onCreateProduct,
  isCreating,
}: {
  filter?: string;
  onCreateProduct: () => void;
  isCreating: boolean;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchProducts = async (lastId?: string) => {
    setIsLoadingMore(true);

    let groq = `*[_type == "product"`;

    if (filter) groq += ` && ${filter}`;
    groq += `] | order(stock asc, name asc)`;

    if (lastId) {
      groq += ` [_id > $lastId][0...20]`;
    } else {
      groq += ` [0...20]`;
    }

    const result = await writeClient.fetch(groq, lastId ? { lastId } : {});

    if (lastId) {
      setProducts((prev) => [...prev, ...result]);
    } else {
      setProducts(result);
    }

    setHasMore(result.length === 20);
    setIsLoadingMore(false);
  };

  // Initial fetch when component mounts or filter changes
  useEffect(() => {
    setProducts([]);        // Reset list when filter changes
    setHasMore(true);
    fetchProducts();
  }, [filter]);

  const loadMore = () => {
    if (products.length > 0) {
      const lastId = products[products.length - 1]._id;
      fetchProducts(lastId);
    }
  };

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={filter ? "No products found" : "No products yet"}
        description={
          filter
            ? "Try adjusting your search terms."
            : "Get started by adding your first product."
        }
        action={
          !filter
            ? {
                label: "Add Product",
                onClick: onCreateProduct,
                disabled: isCreating,
                icon: isCreating ? Loader2 : Plus,
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Table>
          <ProductTableHeader />
          <TableBody>
            {products.map((product) => (
              <ProductRow
                key={product._id}
                documentId={product._id}
                initialData={product}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}

function ProductListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <ProductTableHeader />
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function InventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { filter, isSearching } = useProductSearchFilter(searchQuery);

  const handleCreateProduct = () => {
    startTransition(async () => {
      const newProduct = {
        _type: "product",
        name: "New Product",
        slug: { current: `new-product-${Date.now()}` },
        price: 0,
        stock: 0,
        featured: false,
      };

      const result = await writeClient.create(newProduct);
      router.push(`/admin/inventory/${result._id}`);
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage your product stock and pricing
          </p>
        </div>
        <Button
          onClick={handleCreateProduct}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Product
        </Button>
      </div>

      {/* Search */}
      <AdminSearch
        placeholder="Search products..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="w-full sm:max-w-sm"
      />

      {/* Product List */}
      {isSearching ? (
        <ProductListSkeleton />
      ) : (
        <Suspense fallback={<ProductListSkeleton />}>
          <ProductListContent
            filter={filter}
            onCreateProduct={handleCreateProduct}
            isCreating={isPending}
          />
        </Suspense>
      )}
    </div>
  );
}