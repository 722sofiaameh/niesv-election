import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const title = body.title?.trim();
  const wingId = body.wingId?.trim();

  if (!title || !wingId) {
    return NextResponse.json(
      { error: "Title and wingId are required." },
      { status: 400 },
    );
  }

  const maxOrder = await prisma.position.aggregate({
    where: { wingId },
    _max: { order: true },
  });

  const position = await prisma.position.create({
    data: {
      title,
      wingId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ position }, { status: 201 });
}
