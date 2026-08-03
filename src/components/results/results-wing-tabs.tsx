"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ResultsWingOption } from "@/lib/results-format";

interface ResultsWingTabsProps {
  wingOptions: ResultsWingOption[];
  activeWing: string | null;
  hrefForWing: (slug: string | null) => string;
  className?: string;
}

export function ResultsWingTabs({
  wingOptions,
  activeWing,
  hrefForWing,
  className,
}: ResultsWingTabsProps) {
  if (wingOptions.length <= 1) {
    return null;
  }

  const tabs = [
    { slug: null, label: "All wings" },
    ...wingOptions.map((wing) => ({ slug: wing.slug, label: wing.name })),
  ];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => {
        const isActive = activeWing === tab.slug;
        return (
          <Link
            key={tab.slug ?? "all"}
            href={hrefForWing(tab.slug)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
