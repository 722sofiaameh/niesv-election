import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import {
  getNoBallotReason,
  getPendingVotingPositions,
  syncVoterCompletionStatus,
} from "@/lib/voting-data";
import { DoneScreen } from "@/components/vote/done-screen";
import { NoBallotScreen } from "@/components/vote/no-ballot-screen";
import { VotingFlow } from "@/components/vote/voting-flow";
import { VoterShell } from "@/components/voter/voter-shell";
import { prisma } from "@/lib/prisma";

export default async function VotePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const settings = await prisma.electionSettings.findFirst();
  if (settings && !settings.isVotingOpen) {
    redirect("/");
  }

  let positions = await getPendingVotingPositions(session.voterId);

  if (positions.length === 0) {
    const [hasAnyVotes, reason] = await Promise.all([
      prisma.vote.count({
        where: { voterId: session.voterId },
      }),
      getNoBallotReason(session.voterId),
    ]);

    if (hasAnyVotes === 0 && reason === "unknown") {
      positions = await getPendingVotingPositions(session.voterId);
    }
  }

  await syncVoterCompletionStatus(session.voterId, positions);

  if (positions.length === 0) {
    const [hasAnyVotes, reason] = await Promise.all([
      prisma.vote.count({
        where: { voterId: session.voterId },
      }),
      getNoBallotReason(session.voterId),
    ]);

    return (
      <VoterShell centered>
        <div className="voter-card w-full max-w-lg">
          {hasAnyVotes > 0 ? (
            <DoneScreen voterName={session.name} />
          ) : (
            <NoBallotScreen voterName={session.name} reason={reason} />
          )}
        </div>
      </VoterShell>
    );
  }

  return (
    <VoterShell wide>
      <VotingFlow voterName={session.name} positions={positions} />
    </VoterShell>
  );
}
