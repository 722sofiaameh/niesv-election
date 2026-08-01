import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEligibleRestrictedWingIds,
  getVoterEligibilityIdentity,
  isVoterEligibleForWing,
} from "@/lib/wing-eligibility";
import {
  getPendingVotingPositions,
  syncVoterCompletionStatus,
} from "@/lib/voting-data";

type SubmitChoice = {
  positionId: string;
  candidateIds: string[];
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to submit your vote." },
      { status: 401 },
    );
  }

  let body: { choices?: SubmitChoice[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 },
    );
  }

  const choices = body.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return NextResponse.json(
      { error: "No voting choices were provided." },
      { status: 400 },
    );
  }

  const settings = await prisma.electionSettings.findFirst();
  if (settings && !settings.isVotingOpen) {
    return NextResponse.json(
      { error: "Voting is currently closed." },
      { status: 403 },
    );
  }

  const voter = await getVoterEligibilityIdentity(session.voterId);
  if (!voter) {
    return NextResponse.json(
      { error: "Something went wrong. Please sign in again." },
      { status: 401 },
    );
  }

  const pendingPositions = await getPendingVotingPositions(session.voterId);

  if (pendingPositions.length === 0) {
    return NextResponse.json(
      {
        error: "You have no open positions left to vote on.",
        code: "ALREADY_VOTED",
      },
      { status: 403 },
    );
  }

  if (choices.length !== pendingPositions.length) {
    return NextResponse.json(
      { error: "Please complete all positions before submitting." },
      { status: 400 },
    );
  }

  const positionMap = new Map(
    pendingPositions.map((position) => [position.id, position]),
  );

  const dbPositions = await prisma.position.findMany({
    where: {
      id: { in: pendingPositions.map((position) => position.id) },
    },
    include: {
      wing: { select: { id: true, requiresEligibility: true, isVotingOpen: true } },
      candidates: { select: { id: true } },
    },
  });

  const dbPositionMap = new Map(
    dbPositions.map((position) => [position.id, position]),
  );

  for (const choice of choices) {
    const position = dbPositionMap.get(choice.positionId);
    if (!position || !position.wing.isVotingOpen) {
      return NextResponse.json(
        { error: "Something went wrong. Please start again." },
        { status: 400 },
      );
    }

    if (!positionMap.has(choice.positionId)) {
      return NextResponse.json(
        { error: "Something went wrong. Please start again." },
        { status: 400 },
      );
    }

    const candidateIds = choice.candidateIds ?? [];
    const uniqueIds = new Set(candidateIds);
    if (uniqueIds.size !== candidateIds.length) {
      return NextResponse.json(
        { error: "Duplicate selections are not allowed for one position." },
        { status: 400 },
      );
    }

    if (position.maxSelections <= 1) {
      if (candidateIds.length > 1) {
        return NextResponse.json(
          { error: "Please select only one candidate for this position." },
          { status: 400 },
        );
      }
    } else if (candidateIds.length !== position.maxSelections) {
      return NextResponse.json(
        {
          error: `Please select exactly ${position.maxSelections} candidates for ${position.title}.`,
        },
        { status: 400 },
      );
    }

    for (const candidateId of candidateIds) {
      const validCandidate = position.candidates.some(
        (candidate) => candidate.id === candidateId,
      );
      if (!validCandidate) {
        return NextResponse.json(
          { error: "Something went wrong. Please start again." },
          { status: 400 },
        );
      }
    }
  }

  const eligibleRestrictedWingIds = await getEligibleRestrictedWingIds(voter);

  for (const choice of choices) {
    if (choice.candidateIds.length === 0) continue;

    const position = dbPositionMap.get(choice.positionId);
    if (!position) continue;

    const eligible = await isVoterEligibleForWing(voter, position.wing.id);
    if (!eligible) {
      return NextResponse.json(
        {
          error:
            "You are not eligible to vote in one or more restricted wings.",
        },
        { status: 403 },
      );
    }

    if (
      position.wing.requiresEligibility &&
      !eligibleRestrictedWingIds.has(position.wing.id)
    ) {
      return NextResponse.json(
        {
          error:
            "You are not eligible to vote in one or more restricted wings.",
        },
        { status: 403 },
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const choice of choices) {
        const position = dbPositionMap.get(choice.positionId);
        if (!position) continue;

        const existingCount = await tx.vote.count({
          where: {
            voterId: session.voterId,
            positionId: choice.positionId,
          },
        });

        if (position.maxSelections <= 1) {
          if (existingCount > 0) {
            throw new Error("ALREADY_VOTED_POSITION");
          }
        } else if (existingCount >= position.maxSelections) {
          throw new Error("ALREADY_VOTED_POSITION");
        }

        for (const candidateId of choice.candidateIds) {
          await tx.vote.create({
            data: {
              voterId: session.voterId,
              candidateId,
              positionId: choice.positionId,
            },
          });

          await tx.candidate.update({
            where: { id: candidateId },
            data: { voteCount: { increment: 1 } },
          });
        }
      }
    });

    await syncVoterCompletionStatus(session.voterId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_VOTED_POSITION") {
        return NextResponse.json(
          {
            error:
              "Your vote has already been recorded for one of these positions.",
            code: "ALREADY_VOTED",
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Your vote could not be saved. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
