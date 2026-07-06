import { prisma } from "@/lib/prisma";
import type { VotingPosition } from "@/lib/voting";

export async function getVotingPositions(): Promise<VotingPosition[]> {
  const positions = await prisma.position.findMany({
    include: {
      wing: { select: { name: true } },
      candidates: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          photoUrl: true,
          bio: true,
          status: true,
        },
      },
    },
    orderBy: [{ wing: { name: "asc" } }, { order: "asc" }],
  });

  return positions.map((position) => ({
    id: position.id,
    title: position.title,
    wingName: position.wing.name,
    candidates: position.candidates,
  }));
}

export async function getVoterHasVoted(voterId: string): Promise<boolean> {
  const voter = await prisma.voter.findUnique({
    where: { id: voterId },
    select: { hasVoted: true },
  });
  return voter?.hasVoted ?? false;
}
