import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const [settings, totalVoters, votedCount, wings] = await Promise.all([
    prisma.electionSettings.findFirst(),
    prisma.voter.count(),
    prisma.voter.count({ where: { hasVoted: true } }),
    prisma.wing.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isVotingOpen: true,
        requiresEligibility: true,
        _count: { select: { positions: true } },
      },
    }),
  ]);

  return NextResponse.json({
    settings: settings ?? {
      isVotingOpen: false,
      votingStartsAt: null,
      votingEndsAt: null,
      resultsArePublic: false,
      liveTrackingForManagers: true,
    },
    turnout: {
      total: totalVoters,
      voted: votedCount,
      percentage: totalVoters
        ? Math.round((votedCount / totalVoters) * 100)
        : 0,
    },
    wings,
  });
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await request.json();

  let settings = await prisma.electionSettings.findFirst();

  if (!settings) {
    settings = await prisma.electionSettings.create({ data: {} });
  }

  const data: {
    isVotingOpen?: boolean;
    resultsArePublic?: boolean;
    liveTrackingForManagers?: boolean;
    votingStartsAt?: Date | null;
    votingEndsAt?: Date | null;
  } = {};

  if (typeof body.isVotingOpen === "boolean") {
    data.isVotingOpen = body.isVotingOpen;
  }
  if (typeof body.resultsArePublic === "boolean") {
    data.resultsArePublic = body.resultsArePublic;
  }
  if (typeof body.liveTrackingForManagers === "boolean") {
    data.liveTrackingForManagers = body.liveTrackingForManagers;
  }
  if (body.votingStartsAt !== undefined) {
    data.votingStartsAt = body.votingStartsAt
      ? new Date(body.votingStartsAt)
      : null;
  }
  if (body.votingEndsAt !== undefined) {
    data.votingEndsAt = body.votingEndsAt ? new Date(body.votingEndsAt) : null;
  }

  const updated = await prisma.electionSettings.update({
    where: { id: settings.id },
    data,
  });

  return NextResponse.json({ settings: updated });
}
