import { prisma } from "@/lib/prisma";

export type ResultsCandidate = {
  id: string;
  name: string;
  voteCount: number;
  status: string;
};

export type ResultsPosition = {
  id: string;
  title: string;
  candidates: ResultsCandidate[];
};

export type ResultsWing = {
  id: string;
  name: string;
  positions: ResultsPosition[];
};

export type PublicResultsData = {
  public: true;
  turnout: {
    total: number;
    voted: number;
    percentage: number;
  };
  wings: ResultsWing[];
  updatedAt: string;
};

export type PublicResultsResponse =
  | { public: false }
  | PublicResultsData;

export async function getPublicResults(): Promise<PublicResultsResponse> {
  const settings = await prisma.electionSettings.findFirst();

  if (!settings?.resultsArePublic) {
    return { public: false };
  }

  const [wings, totalVoters, votedCount] = await Promise.all([
    prisma.wing.findMany({
      include: {
        positions: {
          orderBy: { order: "asc" },
          include: {
            candidates: {
              orderBy: { voteCount: "desc" },
              select: {
                id: true,
                name: true,
                voteCount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.voter.count(),
    prisma.voter.count({ where: { hasVoted: true } }),
  ]);

  return {
    public: true,
    turnout: {
      total: totalVoters,
      voted: votedCount,
      percentage: totalVoters
        ? Math.round((votedCount / totalVoters) * 100)
        : 0,
    },
    wings: wings.map((wing) => ({
      id: wing.id,
      name: wing.name,
      positions: wing.positions.map((position) => ({
        id: position.id,
        title: position.title,
        candidates: position.candidates,
      })),
    })),
    updatedAt: new Date().toISOString(),
  };
}
