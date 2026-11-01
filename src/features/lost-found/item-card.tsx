import { CalendarDays, MapPin, SearchCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { LostFoundItemView } from "./types";
import { StatusBadge } from "./status-badge";

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value ?? fallback),
  );
}

export function LostFoundItemCard({ item }: { item: LostFoundItemView }) {
  const image = item.images[0]?.signedUrl;

  return (
    <Link
      href={`/app/lost-found/${item.id}`}
      className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(31,41,79,0.04)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={item.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid size-full place-items-center text-slate-300">
            <SearchCheck className="size-10" strokeWidth={1.5} />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white ${
            item.item_type === "lost" ? "bg-indigo-600" : "bg-emerald-600"
          }`}
        >
          {item.item_type}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{item.category}</p>
            <h2 className="mt-1.5 truncate text-base font-extrabold tracking-[-0.02em] text-ink">{item.title}</h2>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-4 space-y-2 text-xs font-medium text-slate-500">
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 text-slate-400" />
            <span className="truncate">{item.location}</span>
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-slate-400" />
            {formatDate(item.incident_date, item.created_at)}
          </p>
        </div>
        <p className="mt-4 text-[11px] text-slate-400">Reported by {item.reporterName}</p>
      </div>
    </Link>
  );
}
