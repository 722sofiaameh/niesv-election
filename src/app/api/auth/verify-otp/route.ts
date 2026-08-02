import { NextResponse } from "next/server";

import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { verifyLoginOtp } from "@/lib/otp";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { phone?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phone = body.phone?.trim();
  const code = body.code?.trim();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "Please enter your phone number and verification code." },
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
      { error: "Invalid verification code. Please try again." },
      { status: 403 },
    );
  }

  const valid = await verifyLoginOtp(voter.id, code);
  if (!valid) {
    return NextResponse.json(
      {
        error:
          "That code is incorrect or has expired. Request a new code and try again.",
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
