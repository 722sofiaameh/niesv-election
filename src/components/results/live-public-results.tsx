"use client";

import { useCallback, useEffect, useState } from "react";

import { PositionChart } from "@/components/results/position-chart";
import { PositionPieChart } from "@/components/results/position-pie-chart";
import { ResultsBrandHeader } from "@/components/results/results-brand-header";
import { ResultsHoldingScreen } from "@/components/results/results-holding-screen";
import { Spinner } from "@/components/ui/spinner";
import { NiesvLogo } from "@/components/voter/niesv-logo";
import type { PublicResultsResponse } from "@/lib/results-data";

const POLL_INTERVAL_MS = 5000;

export function LivePublicResults() {
  const [data, setData] = useState<PublicResultsResponse | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchResults = useCallback(async (isPoll = false) => {
    if (isPoll) setRefreshing(true);
    try {
      const response = await fetch("/api/results", { cache: "no-store" });
      if (!response.ok) {
        setError(true);
        return;
      }
      const json = (await response.json()) as PublicResultsResponse;
      setData(json);
      setError(false);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(false);
    const interval = setInterval(() => fetchResults(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchResults]);

  if (error && !data) {
    return (
      <main className="results-theme flex min-h-screen flex-col items-center justify-center gap-6 bg-[hsl(var(--background))] px-8 text-[hsl(var(--foreground))]">
        <NiesvLogo size="md" />
        <p className="text-2xl md:text-3xl">Unable to load results.</p>
        <p className="flex items-center gap-3 text-xl text-[hsl(var(--foreground))]/60">
          <Spinner size="sm" variant="accent" label="Retrying" />
          Retrying…
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="results-theme flex min-h-screen flex-col items-center justify-center gap-6 bg-[hsl(var(--background))] px-8 text-[hsl(var(--foreground))]">
        <NiesvLogo size="md" />
        <Spinner size="xl" variant="accent" label="Loading results" />
        <p className="text-2xl text-[hsl(var(--foreground))]/70 md:text-3xl">
          Loading results
        </p>
      </main>
    );
  }

  if (!data.public) {
    return <ResultsHoldingScreen />;
  }

  return (
    <main className="results-theme min-h-screen bg-[hsl(var(--background))] px-6 py-10 text-[hsl(var(--foreground))] md:px-12 md:py-14">
      <div className="h-1.5 w-full bg-[hsl(var(--gold))] shadow-lg" />
      <div className="mx-auto max-w-6xl pt-8">
        <ResultsBrandHeader title="Live Results">
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--foreground))]/55 md:text-base">
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full bg-[hsl(var(--gold))] ${refreshing ? "animate-pulse-soft" : ""}`}
                aria-hidden="true"
              />
              Live
            </span>
            {lastUpdated && (
              <span>
                Updated{" "}
                {lastUpdated.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-lg font-semibold uppercase tracking-wide text-[hsl(var(--foreground))]/50 md:text-xl">
                Voter turnout
              </p>
              <p className="mt-2 text-5xl font-bold tabular-nums transition-all duration-700 md:text-6xl">
                {data.turnout.percentage}%
              </p>
              <p className="mt-2 text-xl text-[hsl(var(--foreground))]/60 md:text-2xl">
                {data.turnout.voted} of {data.turnout.total} eligible voters
                have voted
              </p>
            </div>
            <div className="w-full md:w-96">
              <div className="h-6 overflow-hidden rounded-full border-2 border-[hsl(var(--navy-border))] bg-[hsl(var(--navy-surface))] md:h-8">
                <div
                  className="h-full rounded-full bg-[hsl(var(--gold))] transition-all duration-700 ease-out"
                  style={{ width: `${data.turnout.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </ResultsBrandHeader>

        <div className="mt-10 space-y-14">
          {data.wings.map((wing, wingIndex) => (
            <section key={wing.id} className="animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: `${wingIndex * 80}ms` }}>
              <h2 className="border-l-4 border-[hsl(var(--gold))] pl-4 text-3xl font-bold md:text-4xl">
                {wing.name}
              </h2>
              <div className="mt-8 space-y-12">
                {wing.positions.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-2xl border-2 border-[hsl(var(--navy-border))] bg-[hsl(var(--navy-surface))] p-6 shadow-lg md:p-8"
                  >
                    <h3 className="mb-6 text-2xl font-semibold text-[hsl(var(--gold))] md:text-3xl">
                      {position.title}
                    </h3>
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,22rem)_1fr] xl:items-center">
                      <PositionPieChart
                        candidates={position.candidates}
                        variant="public"
                      />
                      <PositionChart candidates={position.candidates} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {data.wings.length === 0 && (
          <p className="mt-12 text-2xl text-[hsl(var(--foreground))]/50">
            No results to display yet.
          </p>
        )}
      </div>
    </main>
  );
}
