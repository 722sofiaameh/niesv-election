"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PositionPieChart } from "@/components/results/position-pie-chart";
import { Skeleton } from "@/components/ui/skeleton";

type Candidate = {
  id: string;
  name: string;
  status: string;
  voteCount: number;
};

type Position = {
  id: string;
  title: string;
  candidates: Candidate[];
};

type Wing = {
  id: string;
  name: string;
  positions: Position[];
};

export function ResultsPageClient() {
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/results");
    const data = await response.json();
    setWings(data.wings ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="admin-page-title">Results</h2>
          <p className="admin-page-desc">
            Full breakdown by wing and position. {totalVotes} total votes cast.
          </p>
        </div>
        <a
          href="/api/admin/results?format=csv"
          className="voter-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-base"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
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
