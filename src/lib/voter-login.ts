import { NextResponse } from "next/server";

import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { getSupportContact } from "@/lib/constants";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";

export async function buildVoterSessionResponse(voter: {
  id: string;
  phoneNumber: string;
  name: string;
}) {
  const token = await createSessionToken({
    voterId: voter.id,
    phoneNumber: voter.phoneNumber,
    name: voter.name,
  });

  const response = NextResponse.json({ success: true });
  const cookie = sessionCookieOptions(token);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });

  return response;
}

export async function validateVoterForLogin(normalizedPhone: string) {
  const [voter, settings] = await withDbRetry(() =>
    Promise.all([
      prisma.voter.findUnique({
        where: { phoneNumber: normalizedPhone },
      }),
      prisma.electionSettings.findFirst(),
    ]),
  );

  if (!voter) {
    return {
      ok: false as const,
      status: 404,
      error: `This number isn't registered as a voter. Please contact ${getSupportContact()} if you believe this is a mistake.`,
    };
  }

  if (settings && !settings.isVotingOpen) {
    return {
      ok: false as const,
      status: 403,
      error: "Voting is currently closed. Please check back later.",
    };
  }

  return { ok: true as const, voter, settings };
}
