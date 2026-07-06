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

  const voter = await prisma.voter.findUnique({
    where: { phoneNumber: normalized },
  });

  if (!voter) {
    return NextResponse.json(
      {
        error: `This number isn't registered as a voter. Please contact ${getSupportContact()} if you believe this is a mistake.`,
      },
      { status: 404 },
    );
  }

  if (voter.hasVoted) {
    return NextResponse.json(
      {
        error:
          "You have already cast your vote in this election. Thank you for participating.",
        code: "ALREADY_VOTED",
      },
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
