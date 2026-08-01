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
    title?: string;
    maxSelections?: number;
  } = {};

  if (body.title !== undefined) {
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    data.title = title;
  }

  if (body.maxSelections !== undefined) {
    const maxSelections = Number(body.maxSelections);
    if (!Number.isInteger(maxSelections) || maxSelections < 1 || maxSelections > 10) {
      return NextResponse.json(
        { error: "Selections must be a whole number between 1 and 10." },
        { status: 400 },
      );
    }
    data.maxSelections = maxSelections;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  const position = await prisma.position.update({
    where: { id },
    data,
  });

  return NextResponse.json({ position });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = context.params;
  await prisma.position.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
