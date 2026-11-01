type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-brand">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
      </div>
      {action}
    </header>
  );
}
