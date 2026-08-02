import { prisma } from "@/lib/prisma";

export class VoterNotFoundError extends Error {
  constructor() {
    super("Voter not found.");
    this.name = "VoterNotFoundError";
  }
}

export class BallotAlreadyClearError extends Error {
  constructor() {
    super("This voter has no ballot to clear.");
    this.name = "BallotAlreadyClearError";
  }
}

export async function clearVoterBallot(voterId: string) {
  return prisma.$transaction(async (tx) => {
    const voter = await tx.voter.findUnique({
      where: { id: voterId },
      select: { id: true, hasVoted: true },
    });

    if (!voter) {
      throw new VoterNotFoundError();
    }

    const votes = await tx.vote.findMany({
      where: { voterId },
      select: { candidateId: true },
    });

    if (votes.length === 0 && !voter.hasVoted) {
      throw new BallotAlreadyClearError();
    }

    const decrements: Record<string, number> = {};
    for (const vote of votes) {
      decrements[vote.candidateId] = (decrements[vote.candidateId] ?? 0) + 1;
    }

    for (const [candidateId, count] of Object.entries(decrements)) {
      await tx.candidate.update({
        where: { id: candidateId },
        data: { voteCount: { decrement: count } },
      });
    }

    if (votes.length > 0) {
      await tx.vote.deleteMany({ where: { voterId } });
    }

    await tx.voter.update({
      where: { id: voterId },
      data: { hasVoted: false },
    });

    return { votesRemoved: votes.length };
  });
}
