import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getVoterHasVoted, getVotingPositions } from "@/lib/voting-data";
import { DoneScreen } from "@/components/vote/done-screen";
import { VotingFlow } from "@/components/vote/voting-flow";
import { VoterShell } from "@/components/voter/voter-shell";

export default async function VotePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [hasVoted, positions] = await Promise.all([
    getVoterHasVoted(session.voterId),
    getVotingPositions(),
  ]);

  if (hasVoted) {
    return (
      <VoterShell centered>
        <div className="voter-card w-full max-w-lg">
          <DoneScreen voterName={session.name} />
        </div>
      </VoterShell>
    );
  }

  return (
    <VoterShell>
      <VotingFlow voterName={session.name} positions={positions} />
    </VoterShell>
  );
}
