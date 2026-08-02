import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";
import { VoterShell } from "@/components/voter/voter-shell";
import {
  formatElectionDate,
  getElectionStatus,
} from "@/lib/election-status";

export const dynamic = "force-dynamic";

export default async function Home() {
  const status = await getElectionStatus();

  return (
    <VoterShell wide>
      <FadeIn>
        <section className="voter-card">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="voter-heading">Abuja Branch Election</h1>
            <p className="mt-4 voter-subheading">
              Registered NIESV members can cast their ballot online using their
              phone number.
            </p>

            <div className="mt-6">
              {status.isVotingOpen ? (
                <p className="inline-flex items-center gap-2.5 text-lg font-medium text-[hsl(var(--success))]">
                  <span className="status-dot-live" aria-hidden="true" />
                  Voting is open
                </p>
              ) : (
                <p className="text-lg font-medium text-muted-foreground">
                  Voting is currently closed
                </p>
              )}
            </div>

          {(status.votingStartsAt || status.votingEndsAt) && (
            <div className="mt-4 space-y-1 text-base text-muted-foreground">
              {status.votingStartsAt && (
                <p>Opens {formatElectionDate(status.votingStartsAt)}</p>
              )}
              {status.votingEndsAt && (
                <p>Closes {formatElectionDate(status.votingEndsAt)}</p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {status.isVotingOpen ? (
              <Link href="/login" className="voter-btn-accent">
                Sign in to vote
              </Link>
            ) : (
              <span className="voter-btn-accent cursor-not-allowed opacity-50">
                Sign in to vote
              </span>
            )}
            {status.resultsArePublic && (
              <Link href="/results" className="voter-btn-secondary gap-2">
                <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
                View live results
              </Link>
            )}
          </div>

          {!status.isVotingOpen && (
            <p className="mt-6 text-base text-muted-foreground">
              Please check back when voting opens.
            </p>
          )}
        </div>
      </section>
      </FadeIn>

      <FadeIn delay={150}>
      <section className="mt-6 voter-card">
        <h2 className="text-xl font-semibold text-foreground">How to vote</h2>
        <ol className="mt-5 space-y-4 voter-body text-muted-foreground">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </span>
            <span>
              Sign in with your registered phone number. We&apos;ll text you a
              verification code to confirm it&apos;s you.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </span>
            <span>
              Select a candidate for each position, or skip if you wish to
              abstain.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </span>
            <span>
              Review your choices and submit. Your vote cannot be changed
              afterwards.
            </span>
          </li>
        </ol>
      </section>
      </FadeIn>
    </VoterShell>
  );
}
