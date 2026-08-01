import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

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
          Your choices have been saved securely. You cannot change votes you
          have already submitted.
        </p>
        <div className="mt-8 max-w-md space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            Results will be published on this site once voting has closed.
          </p>
          <p>You can safely close this page.</p>
          <p>
            If something doesn&apos;t look right, use{" "}
            <span className="font-semibold text-foreground">Need help?</span>{" "}
            below to contact the election help desk.
          </p>
        </div>
        <Link href="/" className="voter-btn-secondary mt-8 inline-flex px-6 py-2 text-base">
          Return to home
        </Link>
      </FadeIn>
    </div>
  );
}
