import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const wings = await prisma.wing.findMany({
    include: {
      positions: {
        orderBy: { order: "asc" },
        include: {
          candidates: { orderBy: { name: "asc" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ wings });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Wing name is required." }, { status: 400 });
  }

  const wing = await prisma.wing.create({
    data: { name, slug: slugify(name) },
  });

  return NextResponse.json({ wing }, { status: 201 });
}
