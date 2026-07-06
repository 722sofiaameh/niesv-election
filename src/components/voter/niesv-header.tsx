interface NiesvHeaderProps {
  subtitle?: string;
  actions?: React.ReactNode;
}

export function NiesvHeader({
  subtitle = "Abuja Branch Election",
  actions,
}: NiesvHeaderProps) {
  return (
    <header className="border-b-2 border-border bg-primary shadow-md">
      <div className="voter-brand-bar" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 sm:py-6">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70 sm:text-sm">
            Nigerian Institution of Estate Surveyors and Valuers
          </p>
          <p className="mt-1 text-lg font-bold text-primary-foreground sm:text-xl">
            {subtitle}
          </p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
