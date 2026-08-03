import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getVotePageState } from "@/lib/voting-data";
import { DoneScreen } from "@/components/vote/done-screen";
import { NoBallotScreen } from "@/components/vote/no-ballot-screen";
import { VotingFlow } from "@/components/vote/voting-flow";
import { VoterShell } from "@/components/voter/voter-shell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const settings = await prisma.electionSettings.findFirst();
  if (settings && !settings.isVotingOpen) {
    redirect("/");
  }

  let { pendingPositions, completedBallot, hasAnyVotes, noBallotReason } =
    await getVotePageState(session.voterId);

  if (
    pendingPositions.length === 0 &&
    hasAnyVotes === 0 &&
    noBallotReason === "unknown"
  ) {
    ({ pendingPositions, completedBallot, hasAnyVotes, noBallotReason } =
      await getVotePageState(session.voterId));
  }

  if (pendingPositions.length === 0) {
    return (
      <VoterShell centered>
        <div className="voter-card w-full max-w-lg">
          {hasAnyVotes > 0 ? (
            <DoneScreen voterName={session.name} />
          ) : (
            <NoBallotScreen
              voterName={session.name}
              reason={noBallotReason ?? "nothing_open"}
            />
          )}
        </div>
      </VoterShell>
    );
  }

  return (
    <VoterShell wide>
      <VotingFlow
        voterName={session.name}
        positions={pendingPositions}
        completedBallot={completedBallot}
      />
    </VoterShell>
  );
}
