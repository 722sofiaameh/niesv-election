import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubmitChoice = {
  positionId: string;
  candidateId: string | null;
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

  const positions = await prisma.position.findMany({
    include: {
      candidates: { select: { id: true } },
    },
    orderBy: [{ wing: { name: "asc" } }, { order: "asc" }],
  });

  if (choices.length !== positions.length) {
    return NextResponse.json(
      { error: "Please complete all positions before submitting." },
      { status: 400 },
    );
  }

  const positionMap = new Map(
    positions.map((position) => [position.id, position]),
  );

  for (const choice of choices) {
    const position = positionMap.get(choice.positionId);
    if (!position) {
      return NextResponse.json(
        { error: "Something went wrong. Please start again." },
        { status: 400 },
      );
    }

    if (choice.candidateId) {
      const validCandidate = position.candidates.some(
        (candidate) => candidate.id === choice.candidateId,
      );
      if (!validCandidate) {
        return NextResponse.json(
          { error: "Something went wrong. Please start again." },
          { status: 400 },
        );
      }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const voter = await tx.voter.findUnique({
        where: { id: session.voterId },
        select: { hasVoted: true },
      });

      if (!voter) {
        throw new Error("VOTER_NOT_FOUND");
      }

      if (voter.hasVoted) {
        throw new Error("ALREADY_VOTED");
      }

      for (const choice of choices) {
        if (!choice.candidateId) continue;

        await tx.vote.create({
          data: {
            voterId: session.voterId,
            candidateId: choice.candidateId,
            positionId: choice.positionId,
          },
        });

        await tx.candidate.update({
          where: { id: choice.candidateId },
          data: { voteCount: { increment: 1 } },
        });
      }

      const updated = await tx.voter.updateMany({
        where: { id: session.voterId, hasVoted: false },
        data: { hasVoted: true },
      });

      if (updated.count === 0) {
        throw new Error("ALREADY_VOTED");
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_VOTED") {
        return NextResponse.json(
          {
            error:
              "Your vote has already been recorded. You cannot vote again.",
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
