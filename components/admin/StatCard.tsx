"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { writeClient } from "@/sanity/lib/client";

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  documentType: string;
  filter?: string;
  valueFormatter?: (count: number) => string;
  href?: string;
}

function StatCardContent({
  title,
  icon: Icon,
  documentType,
  filter,
  valueFormatter = (count) => count.toString(),
  href,
}: StatCardProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      try {
        let query = `*[_type == $type`;
        if (filter) query += ` && ${filter}`;
        query += `] { _id }`;

        const result = await writeClient.fetch(query, { type: documentType });
        setCount(result.length);
      } catch (error) {
        console.error("Failed to fetch count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [documentType, filter]);

  const content = (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900",
        href &&
          "cursor-pointer transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {loading ? "..." : valueFormatter(count)}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function StatCardSkeleton({
  title,
  icon: Icon,
}: Pick<StatCardProps, "title" | "icon">) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <Skeleton className="mt-2 h-9 w-20" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

export function StatCard(props: StatCardProps) {
  return (
    <Suspense fallback={<StatCardSkeleton title={props.title} icon={props.icon} />}>
      <StatCardContent {...props} />
    </Suspense>
  );
}