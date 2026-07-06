"use client";

import { useState } from "react";

import { FadeIn } from "@/components/ui/fade-in";
import { DoneScreen } from "@/components/vote/done-screen";
import { PositionScreen } from "@/components/vote/position-screen";
import { ReviewScreen } from "@/components/vote/review-screen";
import { VotingProgress } from "@/components/vote/voting-progress";
import { WelcomeScreen } from "@/components/vote/welcome-screen";
import type { VoteChoice, VoteChoices, VotingPosition } from "@/lib/voting";

type VotingStep = "welcome" | "position" | "review" | "done";

interface VotingFlowProps {
  voterName: string;
  positions: VotingPosition[];
}

function getVotingProgress(
  step: VotingStep,
  positionIndex: number,
  total: number,
): number {
  if (step === "done") return 100;
  if (step === "welcome") return 0;
  if (step === "review") return 94;
  const segment = 88 / Math.max(total, 1);
  return 6 + segment * (positionIndex + 1);
}

export function VotingFlow({ voterName, positions }: VotingFlowProps) {
  const [step, setStep] = useState<VotingStep>("welcome");
  const [positionIndex, setPositionIndex] = useState(0);
  const [editingFromReview, setEditingFromReview] = useState(false);
  const [choices, setChoices] = useState<VoteChoices>({});

  const showProgress = step === "position" || step === "review";
  const progress = getVotingProgress(step, positionIndex, positions.length);

  function handlePositionConfirm(choice: VoteChoice) {
    const position = positions[positionIndex];
    setChoices((prev) => ({ ...prev, [position.id]: choice }));

    if (editingFromReview) {
      setEditingFromReview(false);
      setStep("review");
      return;
    }

    if (positionIndex < positions.length - 1) {
      setPositionIndex((index) => index + 1);
      return;
    }

    setStep("review");
  }

  function handleEdit(positionIdx: number) {
    setPositionIndex(positionIdx);
    setEditingFromReview(true);
    setStep("position");
  }

  async function handleSubmit() {
    const payload = positions.map((position) => ({
      positionId: position.id,
      candidateId: choices[position.id]?.candidateId ?? null,
    }));

    const response = await fetch("/api/vote/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choices: payload }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === "ALREADY_VOTED") {
        setStep("done");
        return;
      }
      throw new Error(
        data.error ?? "Your vote could not be saved. Please try again.",
      );
    }

    setStep("done");
  }

  if (positions.length === 0) {
    return (
      <FadeIn>
        <p className="text-center text-xl text-muted-foreground">
          No positions are available to vote on right now.
        </p>
      </FadeIn>
    );
  }

  return (
    <div>
      {showProgress && <VotingProgress value={progress} />}

      {step === "welcome" && (
        <FadeIn key="welcome" variant="scale">
          <WelcomeScreen voterName={voterName} onStart={() => setStep("position")} />
        </FadeIn>
      )}

      {step === "done" && (
        <FadeIn key="done" variant="scale">
          <DoneScreen voterName={voterName} />
        </FadeIn>
      )}

      {step === "review" && (
        <FadeIn key="review">
          <ReviewScreen
            positions={positions}
            choices={choices}
            onEdit={handleEdit}
            onSubmit={handleSubmit}
          />
        </FadeIn>
      )}

      {step === "position" && (
        <FadeIn
          key={`position-${positions[positionIndex].id}-${positionIndex}-${editingFromReview ? "edit" : "vote"}`}
        >
          <PositionScreen
            position={positions[positionIndex]}
            positionIndex={positionIndex}
            totalPositions={positions.length}
            initialChoice={choices[positions[positionIndex].id]}
            onConfirm={handlePositionConfirm}
          />
        </FadeIn>
      )}
    </div>
  );
}
