"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PositionPieChart } from "@/components/results/position-pie-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  filterResultsWings,
  type ResultsWing,
  type ResultsWingOption,
} from "@/lib/results-format";
import { WOMENS_WING_SLUG } from "@/lib/wing-eligibility";

export function ResultsPageClient() {
  const [allWings, setAllWings] = useState<ResultsWing[]>([]);
  const [wingOptions, setWingOptions] = useState<ResultsWingOption[]>([]);
  const [activeWing, setActiveWing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/results");
    const data = await response.json();
    setAllWings(data.wings ?? []);
    setWingOptions(data.wingOptions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const wings = useMemo(
    () => filterResultsWings(allWings, activeWing),
    [allWings, activeWing],
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const totalVotes = wings.reduce(
    (sum, wing) =>
      sum +
      wing.positions.reduce(
        (pSum, position) =>
          pSum +
          position.candidates.reduce((cSum, c) => cSum + c.voteCount, 0),
        0,
      ),
    0,
  );

  const exportHref = activeWing
    ? `/api/admin/results?format=csv&wing=${encodeURIComponent(activeWing)}`
    : "/api/admin/results?format=csv";

  const exportLabel = activeWing
    ? `Export ${wingOptions.find((wing) => wing.slug === activeWing)?.name ?? "wing"} CSV`
    : "Export all CSV";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="admin-page-title">Results</h2>
          <p className="admin-page-desc">
            {activeWing
              ? `Showing ${wings.length} wing. ${totalVotes} votes in this view.`
              : `Full breakdown by wing and position. ${totalVotes} total votes cast.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportHref}
            className="voter-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-base"
          >
            <Download className="h-4 w-4" />
            {exportLabel}
          </a>
          {!activeWing && (
            <a
              href={`/api/admin/results?format=csv&wing=${WOMENS_WING_SLUG}`}
              className="voter-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-base"
            >
              <Download className="h-4 w-4" />
              Export Women&apos;s Wing CSV
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={
            activeWing === null
              ? "rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
              : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          }
          onClick={() => setActiveWing(null)}
        >
          All wings
        </button>
        {wingOptions.map((wing) => (
          <button
            key={wing.id}
            type="button"
            className={
              activeWing === wing.slug
                ? "rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
                : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            }
            onClick={() => setActiveWing(wing.slug)}
          >
            {wing.name}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {wings.map((wing) => (
          <section key={wing.id} className="voter-card p-0">
            <div className="border-b border-border bg-primary px-6 py-4">
              <h3 className="text-lg font-semibold text-primary-foreground">
                {wing.name}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {wing.positions.map((position) => {
                const positionTotal = position.candidates.reduce(
                  (sum, c) => sum + c.voteCount,
                  0,
                );
                const maxVotes = Math.max(
                  ...position.candidates.map((c) => c.voteCount),
                  1,
                );

                return (
                  <div key={position.id} className="px-6 py-5">
                    <div className="mb-4 flex items-baseline justify-between gap-4">
                      <h4 className="text-lg font-semibold">{position.title}</h4>
                      <span className="text-sm text-muted-foreground">
                        {positionTotal} vote(s)
                      </span>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr] lg:items-start">
                      <PositionPieChart
                        candidates={position.candidates}
                        variant="admin"
                      />
                      <div className="space-y-3">
                        {position.candidates.length === 0 ? (
                          <p className="text-base text-muted-foreground">
                            No candidates.
                          </p>
                        ) : (
                          position.candidates.map((candidate) => (
                            <div key={candidate.id}>
                              <div className="mb-1 flex items-center justify-between text-base">
                                <span className="font-medium">{candidate.name}</span>
                                <span className="font-mono text-sm">
                                  {candidate.voteCount}
                                  {positionTotal > 0 && (
                                    <span className="ml-1 text-muted-foreground">
                                      (
                                      {Math.round(
                                        (candidate.voteCount / positionTotal) *
                                          100,
                                      )}
                                      %)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-accent transition-all"
                                  style={{
                                    width: `${(candidate.voteCount / maxVotes) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {wings.length === 0 && (
          <p className="text-base text-muted-foreground">No results yet.</p>
        )}
      </div>
    </div>
  );
}
