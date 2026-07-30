"use client";

import { Check } from "lucide-react";

import { InitialsAvatar } from "@/components/vote/initials-avatar";
import {
  formatCandidateStatus,
  type VotingCandidate,
} from "@/lib/voting";
import { cn } from "@/lib/utils";

interface CandidateCardProps {
  candidate: VotingCandidate;
  selected: boolean;
  onSelect: () => void;
}

export function CandidateCard({
  candidate,
  selected,
  onSelect,
}: CandidateCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-2xl border-2 p-5 text-left shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99]",
        selected
          ? "border-accent bg-accent/10 shadow-md ring-2 ring-accent/30"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      )}
      onClick={onSelect}
    >
      {selected && (
        <span
          className="absolute right-4 top-4 flex h-9 w-9 animate-scale-in items-center justify-center rounded-full border-2 border-accent bg-accent text-accent-foreground shadow-md"
          aria-hidden="true"
        >
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
      )}

      <div className="flex gap-5 sm:gap-6">
        {candidate.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.photoUrl}
            alt=""
            className="h-28 w-28 shrink-0 rounded-full border-2 border-border object-cover shadow-md transition-transform duration-200 sm:h-36 sm:w-36"
          />
        ) : (
          <InitialsAvatar
            name={candidate.name}
            className="h-28 w-28 text-2xl sm:h-36 sm:w-36 sm:text-3xl"
          />
        )}

        <div className="min-w-0 flex-1 pr-10">
          <p className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            {candidate.name}
          </p>
          <p className="mt-1 text-base font-semibold text-accent sm:text-lg">
            {formatCandidateStatus(candidate.status)}
          </p>
          {candidate.bio && (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {candidate.bio}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
