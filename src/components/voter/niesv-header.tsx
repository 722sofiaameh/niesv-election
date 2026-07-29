import Link from "next/link";

import { NiesvLogo } from "@/components/voter/niesv-logo";

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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
          <NiesvLogo priority />
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold leading-snug text-primary-foreground sm:text-base">
              {subtitle}
            </p>
            <p className="mt-0.5 hidden text-xs leading-snug text-primary-foreground/75 sm:block">
              Nigerian Institution of Estate Surveyors and Valuers
            </p>
          </div>
        </Link>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
