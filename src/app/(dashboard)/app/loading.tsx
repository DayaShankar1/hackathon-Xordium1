export default function AppLoading() {
  return (
    <div className="space-y-7" aria-label="Loading page">
      <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
      <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-52 animate-pulse rounded-[24px] border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
