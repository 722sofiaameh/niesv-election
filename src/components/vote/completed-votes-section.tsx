import { CheckCircle2 } from "lucide-react";

import { InitialsAvatar } from "@/components/vote/initials-avatar";
import { formatCandidateStatus, type CompletedBallotEntry } from "@/lib/voting";

interface CompletedVotesSectionProps {
  entries: CompletedBallotEntry[];
}

export function CompletedVotesSection({ entries }: CompletedVotesSectionProps) {
  if (entries.length === 0) {
    return null;
  }

  const wingGroups: {
    wingName: string;
    items: CompletedBallotEntry[];
  }[] = [];

  for (const entry of entries) {
    const existing = wingGroups.find((group) => group.wingName === entry.wingName);
    if (existing) {
      existing.items.push(entry);
    } else {
      wingGroups.push({ wingName: entry.wingName, items: [entry] });
    }
  }

  return (
    <section className="voter-card space-y-6" aria-labelledby="completed-votes-heading">
      <div>
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-1 h-6 w-6 shrink-0 text-[hsl(var(--success))]"
            aria-hidden="true"
          />
          <div>
            <h2 id="completed-votes-heading" className="text-2xl font-bold text-foreground">
              Already recorded
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              You voted on {entries.length} position
              {entries.length === 1 ? "" : "s"} in an earlier session. Those
              choices are saved and cannot be changed here.
            </p>
          </div>
        </div>
      </div>

      {wingGroups.map((group) => (
        <div key={group.wingName} className="space-y-4">
          <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
            {group.wingName}
          </h3>

          {group.items.map((entry) => (
            <div
              key={entry.positionId}
              className="rounded-xl border border-border bg-muted/20 p-4"
            >
              <p className="font-semibold text-foreground">{entry.title}</p>
              <ul className="mt-3 space-y-3">
                {entry.selectedCandidates.map((candidate) => (
                  <li key={candidate.id} className="flex items-center gap-3">
                    {candidate.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={candidate.photoUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <InitialsAvatar name={candidate.name} className="h-12 w-12 text-sm" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCandidateStatus(candidate.status)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
