import { CandidateStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;
  const body = await request.json();

  const data: {
    name?: string;
    bio?: string | null;
    photoUrl?: string | null;
    registrationNumber?: string | null;
    status?: CandidateStatus;
  } = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.bio !== undefined) data.bio = body.bio?.trim() || null;
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl?.trim() || null;
  if (body.registrationNumber !== undefined) {
    data.registrationNumber = body.registrationNumber?.trim() || null;
  }
  if (body.status !== undefined) {
    data.status =
      body.status === "FELLOW" ? CandidateStatus.FELLOW : CandidateStatus.MEMBER;
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data,
  });

  return NextResponse.json({ candidate });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;
  await prisma.candidate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
