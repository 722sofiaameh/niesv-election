import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { WOMENS_WING_SLUG } from "@/lib/wing-eligibility";
import {
  commitWingEligibilityImport,
  validateWingEligibilityCsv,
  type WingEligibilityImportRow,
} from "@/lib/wing-eligibility-import";
import { syncWingEligibleToVoters } from "@/lib/sync-wing-voters";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const wings = await prisma.wing.findMany({
    where: { requiresEligibility: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      requiresEligibility: true,
      _count: { select: { eligibleVoters: true } },
    },
  });

  const womensWing = await prisma.wing.findFirst({
    where: {
      OR: [
        { slug: WOMENS_WING_SLUG },
        { name: { contains: "Women", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      requiresEligibility: true,
      _count: { select: { eligibleVoters: true } },
    },
  });

  return NextResponse.json({ wings, womensWing });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  let body: {
    action?:
      | "validate"
      | "commit"
      | "load-default"
      | "womens-wing-only"
      | "sync-voters";
    wingId?: string;
    csv?: string;
    rows?: WingEligibilityImportRow[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let wingId = body.wingId?.trim();

  if (body.action === "load-default") {
    const wing =
      (wingId
        ? await prisma.wing.findUnique({ where: { id: wingId } })
        : null) ??
      (await prisma.wing.findUnique({ where: { slug: WOMENS_WING_SLUG } })) ??
      (await prisma.wing.findFirst({
        where: { name: { contains: "Women", mode: "insensitive" } },
      }));

    if (!wing) {
      return NextResponse.json(
        { error: "Women's Wing not found in the database." },
        { status: 404 },
      );
    }

    wingId = wing.id;

    const csvPath = join(process.cwd(), "prisma/data/womens-wing-eligible.csv");
    const csvText = readFileSync(csvPath, "utf-8");
    const validation = validateWingEligibilityCsv(csvText);

    if (validation.validCount === 0) {
      return NextResponse.json(
        { error: "Bundled eligibility list has no valid rows." },
        { status: 400 },
      );
    }

    const imported = await commitWingEligibilityImport(
      wing.id,
      validation.validRows,
    );

    const synced = await syncWingEligibleToVoters(wing.id);

    return NextResponse.json({
      imported,
      synced,
      wing: { id: wing.id, name: wing.name },
      invalidCount: validation.invalidCount,
    });
  }

  if (body.action === "sync-voters") {
    const wing =
      (wingId
        ? await prisma.wing.findUnique({ where: { id: wingId } })
        : null) ??
      (await prisma.wing.findUnique({ where: { slug: WOMENS_WING_SLUG } })) ??
      (await prisma.wing.findFirst({
        where: { name: { contains: "Women", mode: "insensitive" } },
      }));

    if (!wing) {
      return NextResponse.json(
        { error: "Women's Wing not found in the database." },
        { status: 404 },
      );
    }

    const synced = await syncWingEligibleToVoters(wing.id);

    return NextResponse.json({
      synced,
      wing: { id: wing.id, name: wing.name },
    });
  }

  if (body.action === "womens-wing-only") {
    const womensWing =
      (await prisma.wing.findUnique({ where: { slug: WOMENS_WING_SLUG } })) ??
      (await prisma.wing.findFirst({
        where: { name: { contains: "Women", mode: "insensitive" } },
      }));

    if (!womensWing) {
      return NextResponse.json(
        { error: "Women's Wing not found in the database." },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.wing.updateMany({ data: { isVotingOpen: false } }),
      prisma.wing.update({
        where: { id: womensWing.id },
        data: { isVotingOpen: true },
      }),
    ]);

    return NextResponse.json({
      wing: { id: womensWing.id, name: womensWing.name },
      message: "Only Women's Wing positions are open for voting.",
    });
  }

  if (!wingId) {
    return NextResponse.json({ error: "wingId is required." }, { status: 400 });
  }

  const wing = await prisma.wing.findUnique({ where: { id: wingId } });
  if (!wing) {
    return NextResponse.json({ error: "Wing not found." }, { status: 404 });
  }

  if (body.action === "validate") {
    if (!body.csv?.trim()) {
      return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
    }

    const validation = validateWingEligibilityCsv(body.csv);
    return NextResponse.json(validation);
  }

  if (body.action === "commit") {
    if (!body.rows?.length) {
      return NextResponse.json(
        { error: "No valid rows to import." },
        { status: 400 },
      );
    }

    const imported = await commitWingEligibilityImport(wingId, body.rows);
    return NextResponse.json({
      imported,
      wing: { id: wing.id, name: wing.name },
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
