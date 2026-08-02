import { NextResponse } from "next/server";

import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { withDbRetry } from "@/lib/db-retry";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { validateVoterForLogin } from "@/lib/voter-login";

export async function POST(request: Request) {
  let body: { phone?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please enter the verification code." },
      { status: 400 },
    );
  }

  const phone = body.phone?.trim();
  const otp = body.otp?.trim();

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 },
    );
  }

  if (!otp || !/^\d{4,8}$/.test(otp)) {
    return NextResponse.json(
      { error: "Please enter the 6-digit code from your SMS." },
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

  let validation;
  try {
    validation = await validateVoterForLogin(normalized);
  } catch (error) {
    console.error("Verify OTP database error:", error);
    return NextResponse.json(
      {
        error:
          "We could not reach the voting database. Please wait a moment and try again.",
      },
      { status: 503 },
    );
  }

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status },
    );
  }

  const { voter } = validation;

  if (!voter.otpCode || !voter.otpExpiresAt) {
    return NextResponse.json(
      { error: "No verification code was sent. Please request a new code." },
      { status: 400 },
    );
  }

  if (voter.otpExpiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      {
        error: "This code has expired. Please request a new one.",
        expired: true,
      },
      { status: 400 },
    );
  }

  let verified: boolean;
  try {
    verified = await verifyOtp(voter.otpCode, otp);
  } catch (error) {
    console.error("Verify OTP Termii error:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't verify your code right now. Please try again.",
      },
      { status: 502 },
    );
  }

  if (!verified) {
    return NextResponse.json(
      { error: "Incorrect code. Please check and try again." },
      { status: 401 },
    );
  }

  await withDbRetry(() =>
    prisma.voter.update({
      where: { id: voter.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    }),
  );

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
