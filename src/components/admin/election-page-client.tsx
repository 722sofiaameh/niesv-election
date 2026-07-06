"use client";

import { useCallback, useEffect, useState } from "react";

import { ButtonLoading } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

type ElectionSettings = {
  id?: string;
  isVotingOpen: boolean;
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  resultsArePublic: boolean;
};

type Turnout = {
  total: number;
  voted: number;
  percentage: number;
};

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function ElectionPageClient() {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [turnout, setTurnout] = useState<Turnout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/election");
    const data = await response.json();
    if (response.ok) {
      setSettings(data.settings);
      setTurnout(data.turnout);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refreshTurnout() {
    const response = await fetch("/api/admin/election");
    const data = await response.json();
    if (response.ok) {
      setTurnout(data.turnout);
    }
  }

  async function save(updates: Partial<ElectionSettings>) {
    if (!settings) return;

    const previous = settings;
    setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
    setSaving(true);

    const response = await fetch("/api/admin/election", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setSettings(previous);
      error("Failed to save settings.");
      return;
    }

    setSettings(data.settings);
    void refreshTurnout();

    if ("isVotingOpen" in updates) {
      success(updates.isVotingOpen ? "Voting is now open." : "Voting is now closed.");
    } else if ("resultsArePublic" in updates) {
      success(
        updates.resultsArePublic
          ? "Results are now public."
          : "Results are now hidden.",
      );
    } else {
      success("Schedule saved.");
    }
  }

  if (loading || !settings || !turnout) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="voter-card space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="voter-card space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="admin-page-title">Election</h2>
        <p className="admin-page-desc">
          Control voting windows and public results visibility.
        </p>
      </div>

      <section className="voter-card">
        <h3 className="text-lg font-semibold">Voter turnout</h3>
        <p className="mt-2 text-3xl font-bold text-primary">
          {turnout.voted}{" "}
          <span className="text-lg font-normal text-muted-foreground">
            of {turnout.total} voters
          </span>
        </p>
        <p className="mt-1 text-base text-muted-foreground">
          {turnout.percentage}% turnout
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${turnout.percentage}%` }}
          />
        </div>
      </section>

      <section className="voter-card space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Voting open</p>
            <p className="text-base text-muted-foreground">
              Allow voters to sign in and cast ballots.
            </p>
          </div>
          <Switch
            checked={settings.isVotingOpen}
            disabled={saving}
            aria-label="Voting open"
            onCheckedChange={(isVotingOpen) => save({ isVotingOpen })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Public results</p>
            <p className="text-base text-muted-foreground">
              Show results to voters on the public site.
            </p>
          </div>
          <Switch
            checked={settings.resultsArePublic}
            disabled={saving}
            aria-label="Public results"
            onCheckedChange={(resultsArePublic) => save({ resultsArePublic })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className="voter-label">
              Voting starts
            </label>
            <input
              id="startsAt"
              type="datetime-local"
              value={toLocalDatetimeValue(settings.votingStartsAt)}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        votingStartsAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      }
                    : prev,
                )
              }
              className="admin-input"
            />
          </div>
          <div>
            <label htmlFor="endsAt" className="voter-label">
              Voting ends
            </label>
            <input
              id="endsAt"
              type="datetime-local"
              value={toLocalDatetimeValue(settings.votingEndsAt)}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        votingEndsAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      }
                    : prev,
                )
              }
              className="admin-input"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() =>
            save({
              votingStartsAt: settings.votingStartsAt,
              votingEndsAt: settings.votingEndsAt,
            })
          }
          className="voter-btn-primary px-6 py-2 text-base"
        >
          {saving ? <ButtonLoading label="Saving" /> : "Save schedule"}
        </button>
      </section>
    </div>
  );
}
