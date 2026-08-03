"use client";

import { FadeIn } from "@/components/ui/fade-in";

interface WelcomeScreenProps {
  voterName: string;
  completedCount?: number;
  pendingCount?: number;
  onStart: () => void;
}

export function WelcomeScreen({
  voterName,
  completedCount = 0,
  pendingCount = 0,
  onStart,
}: WelcomeScreenProps) {
  return (
    <div className="voter-card text-center">
      <FadeIn variant="fade" delay={75}>
        <p className="voter-wing-label">Welcome</p>
      </FadeIn>
      <FadeIn delay={100}>
        <h1 className="mt-3 voter-heading">{voterName}</h1>
      </FadeIn>
      <FadeIn delay={150}>
        {completedCount > 0 ? (
          <>
            <p className="mt-6 voter-subheading">
              You have already voted on {completedCount} position
              {completedCount === 1 ? "" : "s"}. Those choices are saved and
              will be shown on your ballot.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Complete the remaining {pendingCount} position
              {pendingCount === 1 ? "" : "s"} below, then submit.
            </p>
          </>
        ) : (
          <p className="mt-6 voter-subheading">
            Your ballot is on one page. Scroll through each position, tap your
            choice for each one, then submit at the bottom.
          </p>
        )}
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Take your time. If you need help, use{" "}
          <span className="font-semibold text-foreground">Need help?</span> at
          the bottom of the page.
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
