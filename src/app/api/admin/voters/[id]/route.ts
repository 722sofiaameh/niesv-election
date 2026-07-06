import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;

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

  const existing = await prisma.voter.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Voter not found." }, { status: 404 });
  }

  const data: {
    name?: string;
    phoneNumber?: string;
    memberRegistrationNumber?: string;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    data.name = name;
  }

  if (body.memberRegistrationNumber !== undefined) {
    const memberRegistrationNumber = body.memberRegistrationNumber.trim();
    if (!memberRegistrationNumber) {
      return NextResponse.json(
        { error: "Registration number is required." },
        { status: 400 },
      );
    }
    data.memberRegistrationNumber = memberRegistrationNumber;
  }

  if (body.phoneNumber !== undefined) {
    if (existing.hasVoted) {
      return NextResponse.json(
        { error: "Cannot change phone number after a voter has cast their ballot." },
        { status: 400 },
      );
    }

    const normalized = normalizePhoneNumber(body.phoneNumber);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid phone number format." },
        { status: 400 },
      );
    }

    if (normalized !== existing.phoneNumber) {
      const duplicate = await prisma.voter.findUnique({
        where: { phoneNumber: normalized },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Another voter already uses this phone number." },
          { status: 400 },
        );
      }
    }

    data.phoneNumber = normalized;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const voter = await prisma.voter.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      memberRegistrationNumber: true,
      hasVoted: true,
    },
  });

  return NextResponse.json({ voter });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;

  const existing = await prisma.voter.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Voter not found." }, { status: 404 });
  }

  if (existing.hasVoted) {
    return NextResponse.json(
      { error: "Cannot delete a voter who has already voted." },
      { status: 400 },
    );
  }

  await prisma.voter.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
