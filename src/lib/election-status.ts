import { prisma } from "@/lib/prisma";

export type ElectionStatus = {
  isVotingOpen: boolean;
  resultsArePublic: boolean;
  votingStartsAt: Date | null;
  votingEndsAt: Date | null;
};

export async function getElectionStatus(): Promise<ElectionStatus> {
  const settings = await prisma.electionSettings.findFirst();

  return {
    isVotingOpen: settings?.isVotingOpen ?? false,
    resultsArePublic: settings?.resultsArePublic ?? false,
    votingStartsAt: settings?.votingStartsAt ?? null,
    votingEndsAt: settings?.votingEndsAt ?? null,
  };
}

export function formatElectionDate(date: Date): string {
  return date.toLocaleString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
