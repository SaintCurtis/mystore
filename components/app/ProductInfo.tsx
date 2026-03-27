import Link from "next/link";
import { ShieldCheck, RotateCcw, Globe, Tag } from "lucide-react";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { AskAISimilarButton } from "@/components/app/AskAISimilarButton";
import { StockBadge } from "@/components/app/StockBadge";
import { formatPrice } from "@/lib/utils";
import type { PRODUCT_BY_SLUG_QUERYResult } from "@/sanity.types";

interface ProductInfoProps {
  product: NonNullable<PRODUCT_BY_SLUG_QUERYResult>;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const imageUrl = product.images?.[0]?.asset?.url;
  const stock = product.stock ?? 0;

  return (
    <div className="flex flex-col gap-0">

      {/* Category breadcrumb */}
      {product.category && (
        <Link
          href={`/?category=${product.category.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-500 transition-colors hover:text-amber-400"
        >
          <Tag className="h-3 w-3" />
          {product.category.title}
        </Link>
      )}

      {/* Product name */}
      <h1 className="font-display mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
        {product.name}
      </h1>

      {/* Price + stock */}
      <div className="mt-5 flex items-center gap-4">
        <p className="font-display text-3xl font-bold tracking-tight text-amber-400">
          {formatPrice(product.price)}
        </p>
        <StockBadge productId={product._id} stock={stock} />
      </div>

      {/* Description */}
      {product.description && (
        <p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base">
          {product.description}
        </p>
      )}

      {/* CTA block */}
      <div className="mt-8 flex flex-col gap-3">
        <AddToCartButton
          productId={product._id}
          name={product.name ?? "Unknown Product"}
          price={product.price ?? 0}
          image={imageUrl ?? undefined}
          stock={stock}
        />
        <AskAISimilarButton productName={product.name ?? "this product"} />
      </div>

      {/* Trust signals */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, label: "Warranty", sub: "Included" },
          { icon: RotateCcw, label: "7-Day", sub: "Returns" },
          { icon: Globe, label: "Ships", sub: "Worldwide" },
        ].map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-center"
          >
            <Icon className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-zinc-200">{label}</p>
            <p className="text-[11px] text-zinc-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Specs table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Specifications
          </p>
        </div>
        <div className="divide-y divide-zinc-800/60 bg-zinc-900/30">
          {product.material && (
            <SpecRow label="Material" value={product.material} capitalize />
          )}
          {product.color && (
            <SpecRow label="Color" value={product.color} capitalize />
          )}
          {product.dimensions && (
            <SpecRow label="Dimensions" value={product.dimensions} />
          )}
          {product.assemblyRequired !== null &&
            product.assemblyRequired !== undefined && (
              <SpecRow
                label="Assembly"
                value={product.assemblyRequired ? "Required" : "Not required"}
              />
            )}
        </div>
      </div>

    </div>
  );
}

function SpecRow({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`text-sm font-medium text-zinc-200 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}