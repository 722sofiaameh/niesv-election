"use client";

import { useState } from "react";

import { CandidateCard } from "@/components/vote/candidate-card";
import type { VoteChoice, VotingPosition } from "@/lib/voting";
import { isMultiVoteChoice } from "@/lib/voting";

interface PositionScreenProps {
  position: VotingPosition;
  positionIndex: number;
  totalPositions: number;
  initialChoice: VoteChoice | undefined;
  onConfirm: (choice: VoteChoice) => void;
}

export function PositionScreen({
  position,
  positionIndex,
  totalPositions,
  initialChoice,
  onConfirm,
}: PositionScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialChoice && !isMultiVoteChoice(initialChoice)
      ? initialChoice.candidateId
      : null,
  );
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const selectedCandidate = position.candidates.find(
    (candidate) => candidate.id === selectedId,
  );

  function handleConfirm() {
    if (!selectedCandidate) return;
    onConfirm({
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
    });
  }

  function handleSkip() {
    onConfirm(null);
    setShowSkipConfirm(false);
  }

  return (
    <div className="voter-card space-y-6">
      <div>
        <span className="voter-progress-badge">
          Position {positionIndex + 1} of {totalPositions}
        </span>
        <p className="mt-4 voter-wing-label">{position.wingName}</p>
        <h2 className="mt-2 text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          {position.title}
        </h2>
      </div>

      <div className="space-y-4" role="list">
        {position.candidates.map((candidate) => (
          <div key={candidate.id} role="listitem">
            <CandidateCard
              candidate={candidate}
              selected={selectedId === candidate.id}
              onSelect={() => {
                setSelectedId(candidate.id);
                setShowSkipConfirm(false);
              }}
            />
          </div>
        ))}
      </div>

      {selectedCandidate && (
        <div className="animate-fade-in-up motion-reduce:animate-none">
          <button type="button" className="voter-btn-accent w-full" onClick={handleConfirm}>
            Confirm &amp; Continue
          </button>
        </div>
      )}

      <div className="border-t-2 border-border pt-6">
        {!showSkipConfirm ? (
          <button
            type="button"
            className="min-h-14 w-full rounded-xl border-2 border-dashed border-muted-foreground/50 bg-card px-4 py-4 text-lg font-semibold text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 active:scale-[0.99]"
            onClick={() => setShowSkipConfirm(true)}
          >
            Skip this position
          </button>
        ) : (
          <div className="animate-fade-in-up rounded-2xl border-2 border-border bg-secondary p-5 shadow-sm motion-reduce:animate-none">
            <p className="voter-body">
              Skipping means you won&apos;t vote for this position. Are you sure
              you want to continue without voting?
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="voter-btn-secondary flex-1"
                onClick={() => setShowSkipConfirm(false)}
              >
                Go back
              </button>
              <button type="button" className="voter-btn-primary flex-1" onClick={handleSkip}>
                Yes, skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
