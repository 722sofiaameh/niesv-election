import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function buildVoterSearchWhere(search: string) {
  const trimmed = search.trim();
  if (!trimmed) return undefined;

  const orConditions: Array<
    | { name: { contains: string; mode: "insensitive" } }
    | { memberRegistrationNumber: { contains: string; mode: "insensitive" } }
    | { phoneNumber: { contains: string } }
  > = [
    { name: { contains: trimmed, mode: "insensitive" } },
    {
      memberRegistrationNumber: { contains: trimmed, mode: "insensitive" },
    },
  ];

  const digits = trimmed.replace(/\D/g, "");
  if (digits) {
    orConditions.push({ phoneNumber: { contains: digits } });
    const normalized = normalizePhoneNumber(trimmed);
    if (normalized && normalized !== digits) {
      orConditions.push({ phoneNumber: { contains: normalized } });
    }
  }

  return { OR: orConditions };
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) ||
        DEFAULT_PAGE_SIZE,
    ),
  );

  const where = buildVoterSearchWhere(search);

  const [total, voters] = await Promise.all([
    prisma.voter.count({ where }),
    prisma.voter.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        memberRegistrationNumber: true,
        hasVoted: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page && total > 0) {
    const adjustedVoters = await prisma.voter.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (safePage - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        memberRegistrationNumber: true,
        hasVoted: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      voters: adjustedVoters,
      total,
      page: safePage,
      limit,
      totalPages,
    });
  }

  return NextResponse.json({
    voters,
    total,
    page: safePage,
    limit,
    totalPages,
  });
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
