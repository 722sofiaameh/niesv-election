import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import {
  BallotAlreadyClearError,
  clearVoterBallot,
  VoterNotFoundError,
} from "@/lib/clear-voter-ballot";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;

  try {
    const { votesRemoved } = await clearVoterBallot(id);

    const voter = await prisma.voter.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        memberRegistrationNumber: true,
        hasVoted: true,
      },
    });

    return NextResponse.json({
      success: true,
      votesRemoved,
      voter,
    });
  } catch (error) {
    if (error instanceof VoterNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BallotAlreadyClearError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Clear ballot failed:", error);
    return NextResponse.json(
      { error: "Could not clear this ballot. Please try again." },
      { status: 500 },
    );
  }
}
