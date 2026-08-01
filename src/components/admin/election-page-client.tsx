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
  liveTrackingForManagers: boolean;
};

type Turnout = {
  total: number;
  voted: number;
  percentage: number;
};

type WingControl = {
  id: string;
  name: string;
  slug: string;
  isVotingOpen: boolean;
  requiresEligibility: boolean;
  _count: { positions: number };
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
  const [wings, setWings] = useState<WingControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWingId, setSavingWingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/election");
    const data = await response.json();
    if (response.ok) {
      setSettings(data.settings);
      setTurnout(data.turnout);
      setWings(data.wings ?? []);
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
    } else if ("liveTrackingForManagers" in updates) {
      success(
        updates.liveTrackingForManagers
          ? "Campaign tracking links are now active."
          : "Campaign tracking links are now disabled.",
      );
    } else {
      success("Schedule saved.");
    }
  }

  async function toggleWingVoting(wing: WingControl, isVotingOpen: boolean) {
    setSavingWingId(wing.id);
    setWings((prev) =>
      prev.map((item) =>
        item.id === wing.id ? { ...item, isVotingOpen } : item,
      ),
    );

    const response = await fetch(`/api/admin/wings/${wing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVotingOpen }),
    });

    setSavingWingId(null);

    if (!response.ok) {
      setWings((prev) =>
        prev.map((item) =>
          item.id === wing.id ? { ...item, isVotingOpen: !isVotingOpen } : item,
        ),
      );
      error(`Could not update "${wing.name}".`);
      return;
    }

    success(
      isVotingOpen
        ? `"${wing.name}" positions are now on the ballot.`
        : `"${wing.name}" positions are hidden from the ballot.`,
    );
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

        <div className="border-t border-border pt-6">
          <p className="text-lg font-semibold">Open wings</p>
          <p className="mt-1 text-base text-muted-foreground">
            Choose which wings appear on the ballot. Turn off branch wings when
            running a Women&apos;s Wing-only election.
          </p>
          <ul className="mt-4 space-y-3">
            {wings.map((wing) => (
              <li
                key={wing.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{wing.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {wing._count.positions} position
                    {wing._count.positions === 1 ? "" : "s"}
                    {wing.requiresEligibility ? " · restricted access" : ""}
                  </p>
                </div>
                <Switch
                  checked={wing.isVotingOpen}
                  disabled={savingWingId === wing.id}
                  aria-label={`${wing.name} voting open`}
                  onCheckedChange={(checked) => toggleWingVoting(wing, checked)}
                />
              </li>
            ))}
          </ul>
          {wings.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              No wings found. Add wings under Candidates first.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Public results</p>
            <p className="text-base text-muted-foreground">
              Show full results to voters on the public site.
            </p>
          </div>
          <Switch
            checked={settings.resultsArePublic}
            disabled={saving}
            aria-label="Public results"
            onCheckedChange={(resultsArePublic) => save({ resultsArePublic })}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Campaign tracking links</p>
            <p className="text-base text-muted-foreground">
              Let campaign managers use private links to see their
              candidate&apos;s live vote count while public results stay hidden.
            </p>
          </div>
          <Switch
            checked={settings.liveTrackingForManagers}
            disabled={saving}
            aria-label="Campaign tracking links"
            onCheckedChange={(liveTrackingForManagers) =>
              save({ liveTrackingForManagers })
            }
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
