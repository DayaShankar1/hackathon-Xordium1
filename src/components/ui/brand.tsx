import { Orbit } from "lucide-react";
import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      aria-label="CampusSphere home"
    >
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-brand text-white shadow-[0_8px_24px_rgba(86,80,220,0.28)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.42),transparent_35%)]" />
        <Orbit className="relative size-5 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={`block text-[17px] font-bold tracking-[-0.035em] ${inverse ? "text-white" : "text-ink"}`}
          >
            CampusSphere
          </span>
          <span
            className={`mt-1 block text-[9px] font-semibold uppercase tracking-[0.19em] ${inverse ? "text-white/55" : "text-slate-400"}`}
          >
            Everything connected
          </span>
        </span>
      )}
    </Link>
  );
}
