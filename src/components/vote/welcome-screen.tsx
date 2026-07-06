"use client";

import { FadeIn } from "@/components/ui/fade-in";

interface WelcomeScreenProps {
  voterName: string;
  onStart: () => void;
}

export function WelcomeScreen({ voterName, onStart }: WelcomeScreenProps) {
  return (
    <div className="voter-card text-center">
      <FadeIn variant="fade" delay={75}>
        <p className="voter-wing-label">Welcome</p>
      </FadeIn>
      <FadeIn delay={100}>
        <h1 className="mt-3 voter-heading">{voterName}</h1>
      </FadeIn>
      <FadeIn delay={150}>
        <p className="mt-6 voter-subheading">
          You&apos;ll go through each position one at a time. Tap a candidate,
          confirm your choice, then move to the next.
        </p>
      </FadeIn>
      <FadeIn delay={200}>
        <button
          type="button"
          className="voter-btn-accent mt-10 w-full max-w-sm"
          onClick={onStart}
        >
          Start Voting
        </button>
      </FadeIn>
    </div>
  );
}
