import { prisma } from "@/lib/prisma";
import {
  filterResultsWings,
  mapResultsWings,
  type ResultsWing,
  type ResultsWingOption,
} from "@/lib/results-format";

export type {
  ResultsCandidate,
  ResultsPosition,
  ResultsWing,
  ResultsWingOption,
} from "@/lib/results-format";

export {
  buildResultsCsv,
  escapeResultsCsv,
  filterResultsWings,
  resultsCsvFilename,
} from "@/lib/results-format";

export type PublicResultsData = {
  public: true;
  turnout: {
    total: number;
    voted: number;
    percentage: number;
  };
  wings: ResultsWing[];
  wingOptions: ResultsWingOption[];
  wingFilter: string | null;
  updatedAt: string;
};

export type PublicResultsResponse =
  | { public: false }
  | PublicResultsData;

async function fetchResultsWings(): Promise<ResultsWing[]> {
  const wings = await prisma.wing.findMany({
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
  });

  return mapResultsWings(wings);
}

export async function getAdminResults(
  wingFilter?: string | null,
): Promise<{ wings: ResultsWing[]; wingOptions: ResultsWingOption[] }> {
  const wings = await fetchResultsWings();

  return {
    wings: filterResultsWings(wings, wingFilter),
    wingOptions: wings.map((wing) => ({
      id: wing.id,
      name: wing.name,
      slug: wing.slug,
    })),
  };
}

export async function getPublicResults(
  wingFilter?: string | null,
): Promise<PublicResultsResponse> {
  const settings = await prisma.electionSettings.findFirst();

  if (!settings?.resultsArePublic) {
    return { public: false };
  }

  const [wings, totalVoters, votedCount] = await Promise.all([
    fetchResultsWings(),
    prisma.voter.count(),
    prisma.voter.count({ where: { hasVoted: true } }),
  ]);

  const wingOptions = wings.map((wing) => ({
    id: wing.id,
    name: wing.name,
    slug: wing.slug,
  }));

  return {
    public: true,
    turnout: {
      total: totalVoters,
      voted: votedCount,
      percentage: totalVoters
        ? Math.round((votedCount / totalVoters) * 100)
        : 0,
    },
    wings: filterResultsWings(wings, wingFilter),
    wingOptions,
    wingFilter: wingFilter?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
}
