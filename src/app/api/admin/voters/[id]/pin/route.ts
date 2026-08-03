import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { issueVotingPinForVoter } from "@/lib/voting-pin-export";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;

  try {
    const row = await issueVotingPinForVoter(id);
    return NextResponse.json({
      success: true,
      voter: {
        id,
        name: row.name,
        phoneNumber: row.phoneNumber,
        memberRegistrationNumber: row.memberRegistrationNumber,
      },
      votingPin: row.votingPin,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Voter not found.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Issue voting PIN failed:", error);
    return NextResponse.json(
      { error: "Could not issue a voting PIN. Please try again." },
      { status: 500 },
    );
  }
}
