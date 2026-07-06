import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const voters = await prisma.voter.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      memberRegistrationNumber: true,
      hasVoted: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ voters });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  let body: {
    name?: string;
    phoneNumber?: string;
    memberRegistrationNumber?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const memberRegistrationNumber = body.memberRegistrationNumber?.trim() ?? "";
  const normalizedPhone = body.phoneNumber
    ? normalizePhoneNumber(body.phoneNumber)
    : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "A valid phone number is required." },
      { status: 400 },
    );
  }
  if (!memberRegistrationNumber) {
    return NextResponse.json(
      { error: "Registration number is required." },
      { status: 400 },
    );
  }

  const duplicate = await prisma.voter.findUnique({
    where: { phoneNumber: normalizedPhone },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "A voter with this phone number already exists." },
      { status: 400 },
    );
  }

  const voter = await prisma.voter.create({
    data: {
      name,
      phoneNumber: normalizedPhone,
      memberRegistrationNumber,
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      memberRegistrationNumber: true,
      hasVoted: true,
    },
  });

  return NextResponse.json({ voter }, { status: 201 });
}
