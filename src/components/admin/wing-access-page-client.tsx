"use client";

import { RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin-fetch";
import { ButtonLoading } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import type { WingEligibilityImportValidation } from "@/lib/wing-eligibility-import";

type WingSummary = {
  id: string;
  name: string;
  slug: string;
  requiresEligibility: boolean;
  _count: { eligibleVoters: number };
};

export function WingAccessPageClient() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [womensWing, setWomensWing] = useState<WingSummary | null>(null);
  const [csvText, setCsvText] = useState("");
  const [validation, setValidation] = useState<WingEligibilityImportValidation | null>(
    null,
  );
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [preparingWomensOnly, setPreparingWomensOnly] = useState(false);
  const [syncingVoters, setSyncingVoters] = useState(false);

  const refresh = useCallback(async () => {
    const result = await adminFetch<{
      womensWing: WingSummary | null;
    }>("/api/admin/wing-eligibility");

    if (!result.ok) {
      toastError(result.error ?? "Could not load wing access settings.");
      return;
    }

    setWomensWing(result.data?.womensWing ?? null);
  }, [toastError]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function loadOfficialList() {
    if (!womensWing) return;

    setLoadingDefault(true);
    const result = await adminFetch<{
      imported: number;
      invalidCount: number;
      synced?: { created: number };
      wing: { name: string };
    }>("/api/admin/wing-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "load-default",
        wingId: womensWing.id,
      }),
    });
    setLoadingDefault(false);

    if (!result.ok) {
      toastError(result.error ?? "Could not load official list.");
      return;
    }

    await refresh();
    success(
      `Loaded ${result.data?.imported ?? 0} eligible voters for ${result.data?.wing.name ?? "Women's Wing"}. Registered ${result.data?.synced?.created ?? 0} for login.`,
    );
  }

  async function syncVotersForLogin() {
    if (!womensWing) return;

    setSyncingVoters(true);
    const result = await adminFetch<{
      synced: { created: number; skipped: number; total: number };
      wing: { name: string };
    }>("/api/admin/wing-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync-voters",
        wingId: womensWing.id,
      }),
    });
    setSyncingVoters(false);

    if (!result.ok) {
      toastError(result.error ?? "Could not register voters for login.");
      return;
    }

    success(
      `Registered ${result.data?.synced.created ?? 0} new voter(s) for login (${result.data?.synced.skipped ?? 0} already existed).`,
    );
  }

  async function prepareWomensWingOnly() {
    setPreparingWomensOnly(true);
    const result = await adminFetch<{
      wing: { name: string };
      message: string;
    }>("/api/admin/wing-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "womens-wing-only" }),
    });
    setPreparingWomensOnly(false);

    if (!result.ok) {
      toastError(result.error ?? "Could not prepare Women's Wing-only voting.");
      return;
    }

    success(
      result.data?.message ??
        `Only ${result.data?.wing.name ?? "Women's Wing"} is open for voting.`,
    );
  }

  async function handleValidate() {
    if (!womensWing || !csvText.trim()) return;

    setValidating(true);
    const result = await adminFetch<WingEligibilityImportValidation>(
      "/api/admin/wing-eligibility",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          wingId: womensWing.id,
          csv: csvText,
        }),
      },
    );
    setValidating(false);

    if (!result.ok) {
      toastError(result.error ?? "Validation failed.");
      setValidation(null);
      return;
    }

    setValidation(result.data ?? null);
  }

  async function handleImport() {
    if (!womensWing || !validation?.validRows.length) return;

    setImporting(true);
    const result = await adminFetch<{ imported: number; wing: { name: string } }>(
      "/api/admin/wing-eligibility",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          wingId: womensWing.id,
          rows: validation.validRows,
        }),
      },
    );
    setImporting(false);

    if (!result.ok) {
      toastError(result.error ?? "Import failed.");
      return;
    }

    setCsvText("");
    setValidation(null);
    await refresh();
    success(
      `Imported ${result.data?.imported ?? 0} eligible voters for ${result.data?.wing.name ?? "Women's Wing"}.`,
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!womensWing) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Wing access</h1>
        <p className="text-muted-foreground">
          No Women&apos;s Wing found. Add a wing named &quot;Women&apos;s
          Wing&quot; under Candidates first.
        </p>
      </div>
    );
  }

  const isActive =
    womensWing.requiresEligibility && womensWing._count.eligibleVoters > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Wing access</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Restrict who can see and vote on Women&apos;s Wing positions. Only
          voters on the eligible list (matched by phone number) will see those
          positions on their ballot.
        </p>
      </div>

      <section className="voter-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{womensWing.name}</h2>
            <p className="mt-1 text-muted-foreground">
              {womensWing._count.eligibleVoters} eligible voter
              {womensWing._count.eligibleVoters === 1 ? "" : "s"} loaded
            </p>
          </div>
          <span
            className={
              isActive
                ? "badge badge-success whitespace-nowrap"
                : "badge badge-warning whitespace-nowrap"
            }
          >
            {isActive ? "Restricted access active" : "Not configured yet"}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">For tomorrow&apos;s election:</strong>{" "}
          load the official list, register those voters for login, then use the
          button below so only Women&apos;s Wing positions appear on the ballot.
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="voter-btn-primary inline-flex items-center gap-2"
            disabled={loadingDefault}
            onClick={loadOfficialList}
          >
            {loadingDefault ? (
              <ButtonLoading label="Loading list" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Load official list (70 voters)
              </>
            )}
          </button>

          <button
            type="button"
            className="voter-btn-secondary inline-flex items-center gap-2"
            disabled={syncingVoters}
            onClick={syncVotersForLogin}
          >
            {syncingVoters ? (
              <ButtonLoading label="Registering" />
            ) : (
              "Register eligible voters for login"
            )}
          </button>

          <button
            type="button"
            className="voter-btn-secondary inline-flex items-center gap-2"
            disabled={preparingWomensOnly}
            onClick={prepareWomensWingOnly}
          >
            {preparingWomensOnly ? (
              <ButtonLoading label="Preparing" />
            ) : (
              "Open Women's Wing only"
            )}
          </button>
        </div>
      </section>

      <section className="voter-card space-y-4">
        <h2 className="text-lg font-semibold">Upload a custom list</h2>
        <p className="text-sm text-muted-foreground">
          CSV columns: <span className="font-mono">name</span>,{" "}
          <span className="font-mono">phoneNumber</span>, optional{" "}
          <span className="font-mono">registrationNumber</span>
        </p>

        <textarea
          className="min-h-[160px] w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm"
          placeholder="name,phoneNumber,registrationNumber"
          value={csvText}
          onChange={(event) => {
            setCsvText(event.target.value);
            setValidation(null);
          }}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="voter-btn-secondary inline-flex items-center gap-2"
            disabled={validating || !csvText.trim()}
            onClick={handleValidate}
          >
            {validating ? <ButtonLoading label="Checking" /> : "Validate CSV"}
          </button>

          {validation && validation.validCount > 0 && (
            <button
              type="button"
              className="voter-btn-primary inline-flex items-center gap-2"
              disabled={importing}
              onClick={handleImport}
            >
              {importing ? (
                <ButtonLoading label="Importing" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {validation.validCount} voter
                  {validation.validCount === 1 ? "" : "s"}
                </>
              )}
            </button>
          )}
        </div>

        {validation && (
          <div className="rounded-xl border border-border p-4 text-sm">
            <p>
              <strong>{validation.validCount}</strong> valid,{" "}
              <strong>{validation.invalidCount}</strong> invalid
            </p>
            {validation.invalidCount > 0 && (
              <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-destructive">
                {validation.rows
                  .filter((row) => row.errors.length > 0)
                  .slice(0, 10)
                  .map((row) => (
                    <li key={row.rowNumber}>
                      Row {row.rowNumber}: {row.errors.join(" ")}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
