type StatusBadgeProps = {
  status: "open" | "claimed" | "resolved";
};

const styles = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  claimed: "bg-amber-50 text-amber-700 ring-amber-200",
  resolved: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
}
