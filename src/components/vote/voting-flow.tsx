"use client";

import { useState } from "react";

import { FadeIn } from "@/components/ui/fade-in";
import { DoneScreen } from "@/components/vote/done-screen";
import { ScrollBallotScreen } from "@/components/vote/scroll-ballot-screen";
import { WelcomeScreen } from "@/components/vote/welcome-screen";
import type { VoteChoices, VotingPosition } from "@/lib/voting";
import { buildSubmitPayload } from "@/lib/voting";

type VotingStep = "welcome" | "ballot" | "done";

interface VotingFlowProps {
  voterName: string;
  positions: VotingPosition[];
}

export function VotingFlow({ voterName, positions }: VotingFlowProps) {
  const [step, setStep] = useState<VotingStep>("welcome");

  async function handleSubmit(choices: VoteChoices) {
    const payload = buildSubmitPayload(positions, choices);

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

  if (step === "welcome") {
    return (
      <FadeIn key="welcome" variant="scale">
        <WelcomeScreen voterName={voterName} onStart={() => setStep("ballot")} />
      </FadeIn>
    );
  }

  if (step === "done") {
    return (
      <FadeIn key="done" variant="scale">
        <DoneScreen voterName={voterName} />
      </FadeIn>
    );
  }

  return (
    <ScrollBallotScreen
      voterName={voterName}
      positions={positions}
      onSubmit={handleSubmit}
    />
  );
}
