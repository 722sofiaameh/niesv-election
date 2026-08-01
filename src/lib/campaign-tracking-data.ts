import { prisma } from "@/lib/prisma";

export type CampaignTrackingResponse =
  | { available: false }
  | {
      available: true;
      candidate: {
        name: string;
        photoUrl: string | null;
        status: string;
        voteCount: number;
      };
      positionTitle: string;
      positionTotalVotes: number;
      wingName: string;
      updatedAt: string;
    };

export async function getCampaignTrackingData(
  trackingToken: string,
): Promise<CampaignTrackingResponse> {
  const candidate = await prisma.candidate.findUnique({
    where: { trackingToken },
    select: {
      name: true,
      photoUrl: true,
      status: true,
      voteCount: true,
      positionId: true,
      position: {
        select: {
          title: true,
          wing: { select: { name: true, isVotingOpen: true } },
        },
      },
    },
  });

  if (!candidate) {
    return { available: false };
  }

  const settings = await prisma.electionSettings.findFirst();
  const liveTracking = settings?.liveTrackingForManagers ?? true;
  const resultsPublic = settings?.resultsArePublic ?? false;

  if (!liveTracking && !resultsPublic) {
    return { available: false };
  }

  const positionTotalVotes = await prisma.vote.count({
    where: { positionId: candidate.positionId },
  });

  return {
    available: true,
    candidate: {
      name: candidate.name,
      photoUrl: candidate.photoUrl,
      status: candidate.status,
      voteCount: candidate.voteCount,
    },
    positionTitle: candidate.position.title,
    positionTotalVotes,
    wingName: candidate.position.wing.name,
    updatedAt: new Date().toISOString(),
  };
}
