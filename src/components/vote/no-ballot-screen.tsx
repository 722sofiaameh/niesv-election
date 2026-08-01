import { FadeIn } from "@/components/ui/fade-in";
import type { NoBallotReason } from "@/lib/voting-data";

interface NoBallotScreenProps {
  voterName?: string;
  reason?: NoBallotReason;
}

export function NoBallotScreen({ voterName, reason = "restricted_only" }: NoBallotScreenProps) {
  const copy =
    reason === "nothing_open"
      ? {
          title: "Voting is not open yet for you",
          body: "No election positions are open right now. Branch and other wing elections will appear here once the committee opens them.",
        }
      : reason === "unknown"
        ? {
            title: "We could not load your ballot",
            body: "General branch positions appear to be open, but your ballot did not load. Please refresh the page or try again in a moment.",
          }
        : {
            title: "No open positions for you",
            body: "Only the Women's Wing election may be open right now, and that wing is limited to members on the official eligible list. Branch and other wing elections will appear here once they are opened for all voters.",
          };

  return (
    <div className="flex flex-col items-center text-center">
      <FadeIn delay={100}>
        <h1 className="voter-heading">{copy.title}</h1>
      </FadeIn>
      {voterName && (
        <FadeIn delay={150}>
          <p className="mt-4 text-xl font-medium text-foreground">
            Hello, {voterName}.
          </p>
        </FadeIn>
      )}
      <FadeIn delay={200}>
        <p className="mt-6 voter-subheading">{copy.body}</p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          If you believe you should be able to vote, contact the election help
          desk using <span className="font-semibold text-foreground">Need help?</span>{" "}
          below.
        </p>
      </FadeIn>
    </div>
  );
}
