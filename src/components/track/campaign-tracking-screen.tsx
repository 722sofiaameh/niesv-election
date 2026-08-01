"use client";

import { useCallback, useEffect, useState } from "react";

import { InitialsAvatar } from "@/components/vote/initials-avatar";
import { CampaignTrackingChart } from "@/components/track/campaign-tracking-chart";
import { NiesvHeader } from "@/components/voter/niesv-header";
import { Spinner } from "@/components/ui/spinner";
import type { CampaignTrackingResponse } from "@/lib/campaign-tracking-data";
import { formatCandidateStatus } from "@/lib/voting";

const POLL_INTERVAL_MS = 5000;

type AvailableTracking = Extract<CampaignTrackingResponse, { available: true }>;

interface CampaignTrackingScreenProps {
  token: string;
}

export function CampaignTrackingScreen({ token }: CampaignTrackingScreenProps) {
  const [data, setData] = useState<AvailableTracking | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTracking = useCallback(
    async (isPoll = false) => {
      if (isPoll) setRefreshing(true);

      try {
        const response = await fetch(`/api/track/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as CampaignTrackingResponse;

        if (!response.ok || !json.available) {
          setUnavailable(true);
          setData(null);
          return;
        }

        setData(json);
        setUnavailable(false);
        setError(false);
        setLastUpdated(new Date());
      } catch {
        setError(true);
      } finally {
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchTracking(false);
    const interval = setInterval(() => fetchTracking(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  return (
    <div className="voter-theme min-h-screen bg-background">
      <NiesvHeader subtitle="Campaign tracking" />

      <main className="mx-auto max-w-lg px-6 py-8">
        {error && !data && !unavailable && (
          <div className="voter-card text-center">
            <p className="text-xl font-semibold">Unable to load tracking data.</p>
            <p className="mt-3 text-muted-foreground">Please try again shortly.</p>
          </div>
        )}

        {unavailable && (
          <div className="voter-card text-center">
            <p className="text-xl font-semibold">Tracking is not available</p>
            <p className="mt-3 text-muted-foreground">
              This link may be invalid, or live campaign tracking has been turned
              off by the election committee.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <section className="voter-card text-center">
              <p className="voter-wing-label">{data.wingName}</p>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                {data.positionTitle}
              </h1>

              <div className="mt-8 flex flex-col items-center">
                {data.candidate.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.candidate.photoUrl}
                    alt=""
                    className="h-32 w-32 rounded-full border-2 border-border object-cover shadow-md sm:h-40 sm:w-40"
                  />
                ) : (
                  <InitialsAvatar
                    name={data.candidate.name}
                    className="h-32 w-32 text-3xl sm:h-40 sm:w-40 sm:text-4xl"
                  />
                )}

                <p className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
                  {data.candidate.name}
                </p>
                <p className="mt-1 text-lg font-semibold text-accent">
                  {formatCandidateStatus(
                    data.candidate.status as "FELLOW" | "MEMBER",
                  )}
                </p>
              </div>
            </section>

            <section className="voter-card text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Votes for your candidate
              </p>
              <p className="mt-3 text-6xl font-bold tabular-nums text-primary sm:text-7xl">
                {data.candidate.voteCount}
              </p>
              <div className="mt-8">
                <CampaignTrackingChart
                  candidateVotes={data.candidate.voteCount}
                  positionTotalVotes={data.positionTotalVotes}
                />
              </div>
              <p className="mt-4 text-base text-muted-foreground">
                {refreshing ? "Updating…" : "Live count — refreshes every 5 seconds"}
              </p>
              {lastUpdated && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Last updated{" "}
                  {lastUpdated.toLocaleTimeString("en-NG", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              )}
            </section>

            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              This page shows only your candidate&apos;s votes. Other candidates
              and full results are not shown here. Public results will be
              published separately when the committee opens them.
            </p>
          </div>
        )}

        {!data && !unavailable && !error && (
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10" />
          </div>
        )}
      </main>
    </div>
  );
}
