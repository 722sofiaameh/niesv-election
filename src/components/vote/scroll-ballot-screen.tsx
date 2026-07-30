"use client";

import { useMemo, useState } from "react";

import { CandidateCard } from "@/components/vote/candidate-card";
import { ButtonLoading } from "@/components/ui/loading-state";
import { useConfirm } from "@/components/ui/confirm-provider";
import { VotingProgress } from "@/components/vote/voting-progress";
import type { VoteChoice, VoteChoices, VotingPosition } from "@/lib/voting";

interface ScrollBallotScreenProps {
  voterName: string;
  positions: VotingPosition[];
  onSubmit: (choices: VoteChoices) => Promise<void>;
}

interface BallotPositionSectionProps {
  position: VotingPosition;
  positionIndex: number;
  totalPositions: number;
  choice: VoteChoice | undefined;
  onChoiceChange: (choice: VoteChoice) => void;
}

function BallotPositionSection({
  position,
  positionIndex,
  totalPositions,
  choice,
  onChoiceChange,
}: BallotPositionSectionProps) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const selectedId = choice?.candidateId ?? null;
  const isSkipped = choice === null;

  function handleSelect(candidateId: string, candidateName: string) {
    setShowSkipConfirm(false);
    onChoiceChange({ candidateId, candidateName });
  }

  function handleSkip() {
    onChoiceChange(null);
    setShowSkipConfirm(false);
  }

  return (
    <section
      id={`position-${position.id}`}
      className="voter-card scroll-mt-6 space-y-5"
      aria-labelledby={`position-title-${position.id}`}
    >
      <div>
        <span className="voter-progress-badge">
          Position {positionIndex + 1} of {totalPositions}
        </span>
        <h2
          id={`position-title-${position.id}`}
          className="mt-3 text-2xl font-bold leading-snug text-foreground sm:text-3xl"
        >
          {position.title}
        </h2>
        {isSkipped && (
          <p className="mt-2 text-base font-medium text-muted-foreground">
            Skipped — no vote for this position
          </p>
        )}
      </div>

      <div className="space-y-4" role="list">
        {position.candidates.map((candidate) => (
          <div key={candidate.id} role="listitem">
            <CandidateCard
              candidate={candidate}
              selected={selectedId === candidate.id}
              onSelect={() => handleSelect(candidate.id, candidate.name)}
            />
          </div>
        ))}
      </div>

      <div className="border-t-2 border-border pt-5">
        {!showSkipConfirm ? (
          <button
            type="button"
            className="min-h-12 w-full rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card px-4 py-3 text-base font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:bg-secondary hover:text-foreground"
            onClick={() => setShowSkipConfirm(true)}
          >
            Skip this position
          </button>
        ) : (
          <div className="rounded-2xl border-2 border-border bg-secondary p-5">
            <p className="voter-body">
              Skipping means you won&apos;t vote for this position. Continue?
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="voter-btn-secondary flex-1"
                onClick={() => setShowSkipConfirm(false)}
              >
                Go back
              </button>
              <button
                type="button"
                className="voter-btn-primary flex-1"
                onClick={handleSkip}
              >
                Yes, skip
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function ScrollBallotScreen({
  voterName,
  positions,
  onSubmit,
}: ScrollBallotScreenProps) {
  const confirm = useConfirm();
  const [choices, setChoices] = useState<VoteChoices>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const wingGroups = useMemo(() => {
    const groups: {
      wingName: string;
      items: { position: VotingPosition; index: number }[];
    }[] = [];

    for (let index = 0; index < positions.length; index++) {
      const position = positions[index];
      const existing = groups.find((group) => group.wingName === position.wingName);
      if (existing) {
        existing.items.push({ position, index });
      } else {
        groups.push({ wingName: position.wingName, items: [{ position, index }] });
      }
    }

    return groups;
  }, [positions]);

  const answeredCount = positions.filter(
    (position) => choices[position.id] !== undefined,
  ).length;
  const progress =
    positions.length === 0
      ? 0
      : Math.round((answeredCount / positions.length) * 100);

  async function handleSubmit() {
    setError("");

    const unanswered = positions.filter(
      (position) => choices[position.id] === undefined,
    );

    if (unanswered.length > 0) {
      setError(
        "Please select a candidate or skip every position before submitting.",
      );
      const first = document.getElementById(`position-${unanswered[0].id}`);
      first?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const ok = await confirm({
      title: "Submit your vote?",
      description:
        "Please confirm you are ready to submit. You cannot change your vote afterwards.",
      confirmLabel: "Submit vote",
      cancelLabel: "Go back",
    });

    if (!ok) return;

    setSubmitting(true);
    try {
      await onSubmit(choices);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your vote could not be saved. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="voter-card">
        <p className="voter-wing-label">Ballot</p>
        <h1 className="mt-2 voter-heading">Cast your vote</h1>
        <p className="mt-4 voter-subheading">
          Hello, {voterName}. All positions are on this page — scroll down, make
          your choices, then submit at the bottom.
        </p>
        <p className="mt-3 text-base text-muted-foreground">
          {answeredCount} of {positions.length} positions completed
        </p>
      </div>

      <VotingProgress value={progress} />

      {wingGroups.map((group) => (
        <div key={group.wingName} className="space-y-6">
          <div className="border-b-2 border-accent/30 pb-2">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {group.wingName}
            </h2>
          </div>

          {group.items.map(({ position, index }) => (
            <BallotPositionSection
              key={position.id}
              position={position}
              positionIndex={index}
              totalPositions={positions.length}
              choice={choices[position.id]}
              onChoiceChange={(choice) =>
                setChoices((prev) => ({ ...prev, [position.id]: choice }))
              }
            />
          ))}
        </div>
      ))}

      <div className="voter-card space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Ready to submit?</h2>
        <p className="text-lg text-muted-foreground">
          Check your choices above, then submit your ballot.
        </p>

        {error && (
          <p role="alert" className="voter-alert-error">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={submitting}
          className="voter-btn-accent w-full"
          onClick={handleSubmit}
        >
          {submitting ? (
            <ButtonLoading label="Submitting vote" variant="onAccent" />
          ) : (
            "Submit My Vote"
          )}
        </button>
      </div>
    </div>
  );
}
