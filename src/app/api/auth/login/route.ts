import { NextResponse } from "next/server";

import { getSupportContact } from "@/lib/constants";
import { sendLoginOtp } from "@/lib/otp";
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

  try {
    const result = await sendLoginOtp(voter.id, voter.phoneNumber);
    return NextResponse.json({
      success: true,
      requiresOtp: true,
      phoneNumber: voter.phoneNumber,
      cooldown: result.cooldown,
      message: result.cooldown
        ? "A code was sent recently. Please check your messages or wait a minute before requesting again."
        : "We sent a verification code to your phone by text message.",
    });
  } catch (error) {
    console.error("OTP send failed:", error);
    return NextResponse.json(
      {
        error:
          "We could not send a verification code. Please try again or contact the election help desk.",
      },
      { status: 503 },
    );
  }
}
