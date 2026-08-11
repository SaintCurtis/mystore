import { Cog, Check } from "lucide-react";

interface BrandMarkProps {
  className?: string;
}

/**
 * The Saint's TechNet brand mark — a gear with a green verified checkbox badge.
 * The gear takes its color from className (e.g. "h-4 w-4 text-zinc-950"); the
 * checkbox badge is always green with a white check, independent of the gear
 * color, so it reads as a verification mark rather than a decorative accent.
 */
export function BrandMark({ className = "h-4 w-4" }: BrandMarkProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      <Cog className="absolute inset-0 m-auto h-[88%] w-[88%]" strokeWidth={2.4} />
      <span className="absolute inset-0 m-auto h-[36%] w-[36%] rounded-[22%] bg-green-600 ring-2 ring-background" />
      <Check className="absolute inset-0 m-auto h-[20%] w-[20%] text-white" strokeWidth={4} />
    </span>
  );
}