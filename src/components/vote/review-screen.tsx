"use client";

import { useState } from "react";

import { FadeIn } from "@/components/ui/fade-in";
import { ButtonLoading } from "@/components/ui/loading-state";

import type { VoteChoices, VotingPosition } from "@/lib/voting";

interface ReviewScreenProps {
  positions: VotingPosition[];
  choices: VoteChoices;
  onEdit: (positionIndex: number) => void;
  onSubmit: () => Promise<void>;
}

export function ReviewScreen({
  positions,
  choices,
  onEdit,
  onSubmit,
}: ReviewScreenProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await onSubmit();
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
    <div className="space-y-6">
      <div className="voter-card">
        <h2 className="voter-heading">Review your choices</h2>
        <p className="mt-4 voter-subheading">
          Please check your selections below. Once you submit, your vote cannot
          be changed.
        </p>
      </div>

      <ul className="space-y-4">
        {positions.map((position, index) => {
          const choice = choices[position.id];
          const stagger = ([0, 75, 150, 200] as const)[Math.min(index, 3)];
          return (
            <FadeIn key={position.id} delay={stagger}>
            <li
              className="rounded-2xl border-2 border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="voter-wing-label">{position.wingName}</p>
                  <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                    {position.title}
                  </p>
                  <p className="mt-3 text-lg sm:text-xl">
                    {choice ? (
                      <span className="font-medium text-foreground">
                        {choice.candidateName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Skipped — no vote for this position
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  className="voter-btn-secondary shrink-0 px-5 py-2 text-base disabled:opacity-50"
                  onClick={() => onEdit(index)}
                >
                  Edit
                </button>
              </div>
            </li>
            </FadeIn>
          );
        })}
      </ul>

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
  );
}
