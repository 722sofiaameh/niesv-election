import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;
  const body = await request.json();

  const data: {
    name?: string;
    slug?: string;
    isVotingOpen?: boolean;
  } = {};

  if (typeof body.isVotingOpen === "boolean") {
    data.isVotingOpen = body.isVotingOpen;
  }

  if (body.name !== undefined) {
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Wing name is required." }, { status: 400 });
    }
    data.name = name;
    data.slug = slugify(name);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  const wing = await prisma.wing.update({
    where: { id },
    data,
  });

  return NextResponse.json({ wing });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;
  await prisma.wing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
