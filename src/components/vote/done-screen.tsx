import { CheckCircle2 } from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";

interface DoneScreenProps {
  voterName?: string;
}

export function DoneScreen({ voterName }: DoneScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-20 w-20 animate-success-pop items-center justify-center rounded-full border-4 border-accent bg-accent/15 shadow-md motion-reduce:animate-none">
        <CheckCircle2
          className="h-11 w-11 text-accent"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
      <FadeIn delay={150}>
        <h1 className="mt-8 voter-heading">Your vote has been recorded</h1>
      </FadeIn>
      {voterName && (
        <FadeIn delay={200}>
          <p className="mt-4 text-xl font-medium text-foreground">
            Thank you, {voterName}.
          </p>
        </FadeIn>
      )}
      <FadeIn delay={300}>
        <p className="mt-6 voter-subheading">
          Your choices have been saved securely. You cannot change your vote or
          vote again in this election.
        </p>
      </FadeIn>
    </div>
  );
}
