import { CandidateStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingToken } from "@/lib/tracking-token";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const name = body.name?.trim();
  const positionId = body.positionId?.trim();
  const bio = body.bio?.trim() || null;
  const photoUrl = body.photoUrl?.trim() || null;
  const registrationNumber = body.registrationNumber?.trim() || null;
  const status =
    body.status === "FELLOW" ? CandidateStatus.FELLOW : CandidateStatus.MEMBER;

  if (!name || !positionId) {
    return NextResponse.json(
      { error: "Name and positionId are required." },
      { status: 400 },
    );
  }

  const candidate = await prisma.candidate.create({
    data: {
      name,
      positionId,
      bio,
      photoUrl,
      registrationNumber,
      status,
      trackingToken: generateTrackingToken(),
    },
  });

  return NextResponse.json({ candidate }, { status: 201 });
}
