import { NextResponse } from "next/server";

import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { getSupportContact } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please enter your phone number." },
      { status: 400 },
    );
  }

  const phone = body.phone?.trim();
  if (!phone) {
    return NextResponse.json(
      { error: "Please enter your phone number." },
      { status: 400 },
    );
  }

  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return NextResponse.json(
      { error: "Please enter a valid Nigerian phone number." },
      { status: 400 },
    );
  }

  let voter;
  let settings;

  try {
    [voter, settings] = await Promise.all([
      prisma.voter.findUnique({
        where: { phoneNumber: normalized },
      }),
      prisma.electionSettings.findFirst(),
    ]);
  } catch (error) {
    console.error("Login database error:", error);
    return NextResponse.json(
      {
        error:
          "We could not reach the voting database. Please wait a moment and try again.",
      },
      { status: 503 },
    );
  }

  if (!voter) {
    return NextResponse.json(
      {
        error: `This number isn't registered as a voter. Please contact ${getSupportContact()} if you believe this is a mistake.`,
      },
      { status: 404 },
    );
  }

  if (settings && !settings.isVotingOpen) {
    return NextResponse.json(
      { error: "Voting is currently closed. Please check back later." },
      { status: 403 },
    );
  }

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
