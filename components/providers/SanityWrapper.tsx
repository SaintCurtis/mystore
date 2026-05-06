"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/loaders/LoadingSpinner";

const SanityAppProvider = dynamic(
  () => import("@/components/providers/SanityAppProvider"),
  {
    ssr: false,
    loading: () => (
      <LoadingSpinner text="Loading..." isFullScreen size="lg" />
    ),
  }
);

export function SanityWrapper({ children }: { children: React.ReactNode }) {
  return <SanityAppProvider>{children}</SanityAppProvider>;
}