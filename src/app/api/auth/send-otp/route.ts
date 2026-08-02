import { NextResponse } from "next/server";

import { maskPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { getSmsDeliveryError, getTermiiConfigError, sendOtp } from "@/lib/otp";
import {
  getOtpResendWaitSeconds,
  validateVoterForLogin,
} from "@/lib/voter-login";

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

  let validation;
  try {
    validation = await validateVoterForLogin(normalized);
  } catch (error) {
    console.error("Send OTP database error:", error);
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

  const resendWait = getOtpResendWaitSeconds(voter.otpExpiresAt);
  if (resendWait > 0) {
    return NextResponse.json(
      {
        error: `Please wait ${resendWait} seconds before requesting a new code.`,
        resendWaitSeconds: resendWait,
      },
      { status: 429 },
    );
  }

  try {
    const { pinId, expiresAt, deliveryMethod } = await sendOtp(normalized);

    await withDbRetry(() =>
      prisma.voter.update({
        where: { id: voter.id },
        data: {
          otpCode: pinId,
          otpExpiresAt: expiresAt,
        },
      }),
    );

    return NextResponse.json({
      success: true,
      maskedPhone: maskPhoneNumber(normalized),
      deliveryMethod: deliveryMethod ?? "sms",
      resendWaitSeconds: 60,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    const smsDeliveryError = getSmsDeliveryError(error);
    if (smsDeliveryError === "sms_delivery_failed") {
      const helpPhone =
        process.env.NEXT_PUBLIC_HELP_PHONE_DISPLAY ??
        process.env.NEXT_PUBLIC_HELP_PHONE ??
        "the election help desk";
      return NextResponse.json(
        {
          error: `We couldn't deliver a verification code to your phone. If you have SMS Do-Not-Disturb (DND) enabled, you may need help signing in. Call ${helpPhone}.`,
        },
        { status: 502 },
      );
    }
    const termiiError = getTermiiConfigError(error);
    if (termiiError === "termii_invalid_key") {
      return NextResponse.json(
        {
          error:
            "SMS service is not configured correctly. Please contact the election committee.",
        },
        { status: 502 },
      );
    }
    if (termiiError === "termii_network") {
      return NextResponse.json(
        {
          error:
            "We couldn't reach the SMS service. Please try again in a moment.",
        },
        { status: 502 },
      );
    }
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("country inactive")
    ) {
      return NextResponse.json(
        {
          error:
            "SMS delivery is not yet enabled for Nigeria on this account. Please contact the election committee.",
        },
        { status: 502 },
      );
    }
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("senderid not found")
    ) {
      return NextResponse.json(
        {
          error:
            "SMS sender ID is not configured correctly. Please contact the election committee.",
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        error:
          "We couldn't send a verification code right now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
