import { Cog, Check } from "lucide-react";

interface BrandMarkProps {
  className?: string;
}

/**
 * The Saint's TechNet brand mark — a gear with a checkmark badge.
 * Drop-in replacement for the old CpuChipIcon/Cpu usage: sizing and
 * color are controlled the same way, via className (e.g. "h-4 w-4 text-zinc-950").
 */
export function BrandMark({ className = "h-4 w-4" }: BrandMarkProps) {
  return (
    <span className={`relative inline-block ${className}`}>
      <Cog className="absolute inset-0 m-auto h-[88%] w-[88%]" strokeWidth={2.4} />
      <span className="absolute inset-0 m-auto h-[34%] w-[34%] rounded-[22%] bg-[#fff9ee]" />
      <Check className="absolute inset-0 m-auto h-[40%] w-[40%]" strokeWidth={3.5} />
    </span>
  );
}