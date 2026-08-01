import { prisma } from "@/lib/prisma";
import type { VotingPosition } from "@/lib/voting";
import { getEligibleRestrictedWingIds } from "@/lib/wing-eligibility";

function isTransientPrismaError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    return code === "P2024" || code === "P1001" || code === "P1008";
  }
  return false;
}

async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientPrismaError(error) || attempt === attempts - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  throw lastError;
}

function mapPosition(position: {
  id: string;
  title: string;
  maxSelections: number;
  wing: { name: string };
  candidates: VotingPosition["candidates"];
}): VotingPosition {
  return {
    id: position.id,
    title: position.title,
    wingName: position.wing.name,
    maxSelections: position.maxSelections,
    candidates: position.candidates,
  };
}

async function getVoterIdentity(voterId: string) {
  return prisma.voter.findUnique({
    where: { id: voterId },
    select: {
      phoneNumber: true,
      memberRegistrationNumber: true,
    },
  });
}

async function getEligibleOpenPositions(voterId: string) {
  return withPrismaRetry(async () => {
    const voter = await getVoterIdentity(voterId);
    if (!voter) {
      return [];
    }

    const eligibleRestrictedWingIds = await getEligibleRestrictedWingIds(voter);

    const positions = await prisma.position.findMany({
      where: {
        wing: { isVotingOpen: true },
      },
      include: {
        wing: {
          select: { id: true, name: true, requiresEligibility: true },
        },
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

    return positions
      .filter((position) => {
        if (!position.wing.requiresEligibility) {
          return true;
        }
        return eligibleRestrictedWingIds.has(position.wing.id);
      })
      .map((position) => mapPosition(position));
  });
}

function isPositionPending(
  position: VotingPosition,
  voteCount: number,
): boolean {
  if (position.maxSelections <= 1) {
    return voteCount === 0;
  }
  return voteCount < position.maxSelections;
}

export async function getVotingPositions(
  voterId?: string,
): Promise<VotingPosition[]> {
  if (!voterId) {
    const positions = await prisma.position.findMany({
      where: {
        wing: { isVotingOpen: true },
      },
      select: {
        id: true,
        title: true,
        maxSelections: true,
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

    return positions.map((position) => mapPosition(position));
  }

  return getEligibleOpenPositions(voterId);
}

export async function getPendingVotingPositions(
  voterId: string,
): Promise<VotingPosition[]> {
  const [eligiblePositions, existingVotes] = await Promise.all([
    getEligibleOpenPositions(voterId),
    prisma.vote.findMany({
      where: { voterId },
      select: { positionId: true },
    }),
  ]);

  const voteCounts = new Map<string, number>();
  for (const vote of existingVotes) {
    voteCounts.set(vote.positionId, (voteCounts.get(vote.positionId) ?? 0) + 1);
  }

  return eligiblePositions.filter((position) =>
    isPositionPending(position, voteCounts.get(position.id) ?? 0),
  );
}

export async function syncVoterCompletionStatus(
  voterId: string,
  pending?: VotingPosition[],
): Promise<boolean> {
  const pendingPositions =
    pending ?? (await getPendingVotingPositions(voterId));

  if (pendingPositions.length === 0) {
    const voteCount = await prisma.vote.count({ where: { voterId } });
    if (voteCount === 0) {
      const reason = await getNoBallotReason(voterId);
      if (reason === "unknown") {
        await prisma.voter.update({
          where: { id: voterId },
          data: { hasVoted: false },
        });
        return false;
      }
    }
  }

  const hasVoted = pendingPositions.length === 0;

  await prisma.voter.update({
    where: { id: voterId },
    data: { hasVoted },
  });

  return hasVoted;
}

export async function getVoterHasVoted(voterId: string): Promise<boolean> {
  const pending = await getPendingVotingPositions(voterId);
  return pending.length === 0;
}

export type NoBallotReason = "restricted_only" | "nothing_open" | "unknown";

export async function getNoBallotReason(
  voterId: string,
): Promise<NoBallotReason> {
  const openWings = await prisma.wing.findMany({
    where: { isVotingOpen: true },
    select: {
      requiresEligibility: true,
      _count: { select: { positions: true } },
    },
  });

  const openWingsWithPositions = openWings.filter(
    (wing) => wing._count.positions > 0,
  );

  if (openWingsWithPositions.length === 0) {
    return "nothing_open";
  }

  const hasOpenGeneralWing = openWingsWithPositions.some(
    (wing) => !wing.requiresEligibility,
  );

  if (hasOpenGeneralWing) {
    return "unknown";
  }

  return "restricted_only";
}
