import { NextResponse } from "next/server";

import { normalizePhoneNumber } from "@/lib/phone";
import {
  buildVoterSessionResponse,
  validateVoterForLogin,
} from "@/lib/voter-login";
import {
  isValidVotingPinFormat,
  verifyVotingPin,
} from "@/lib/voting-pin";

export async function POST(request: Request) {
  let body: { phone?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Please enter your voting PIN." },
      { status: 400 },
    );
  }

  const phone = body.phone?.trim();
  const pin = body.pin?.trim() ?? "";

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 },
    );
  }

  if (!isValidVotingPinFormat(pin)) {
    return NextResponse.json(
      { error: "Please enter your 8-character voting PIN." },
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
    console.error("Verify PIN database error:", error);
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

  if (!voter.votingPinHash) {
    return NextResponse.json(
      {
        error:
          "No voting PIN has been issued for this number. Please contact the election help desk.",
      },
      { status: 400 },
    );
  }

  if (!verifyVotingPin(voter.votingPinHash, pin)) {
    return NextResponse.json(
      { error: "Incorrect voting PIN. Please check and try again." },
      { status: 401 },
    );
  }

  return buildVoterSessionResponse(voter);
}
