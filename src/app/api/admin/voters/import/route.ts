import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  validateVoterCsv,
  type VoterImportRow,
} from "@/lib/voter-import";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  let body: {
    action?: "validate" | "commit";
    csv?: string;
    rows?: VoterImportRow[];
    skippedRows?: VoterImportRow[];
    updateExisting?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "validate") {
    if (!body.csv?.trim()) {
      return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
    }

    const existing = await prisma.voter.findMany({
      select: { phoneNumber: true },
    });
    const existingPhones = new Set(existing.map((voter) => voter.phoneNumber));
    const validation = validateVoterCsv(body.csv, existingPhones);

    return NextResponse.json(validation);
  }

  if (body.action === "commit") {
    if (!body.rows?.length && !body.skippedRows?.length) {
      return NextResponse.json(
        { error: "No valid rows to import." },
        { status: 400 },
      );
    }

    const existing = await prisma.voter.findMany({
      select: { phoneNumber: true },
    });
    const existingPhones = new Set(existing.map((voter) => voter.phoneNumber));

    const toImport = (body.rows ?? []).filter(
      (row) => !existingPhones.has(row.phoneNumber),
    );

    let imported = 0;
    if (toImport.length > 0) {
      const result = await prisma.voter.createMany({
        data: toImport,
        skipDuplicates: true,
      });
      imported = result.count;
    }

    let updated = 0;
    if (body.updateExisting && body.skippedRows?.length) {
      for (const row of body.skippedRows) {
        const result = await prisma.voter.updateMany({
          where: { phoneNumber: row.phoneNumber },
          data: {
            name: row.name,
            memberRegistrationNumber: row.memberRegistrationNumber,
          },
        });
        updated += result.count;
      }
    }

    if (imported === 0 && updated === 0) {
      return NextResponse.json(
        { error: "Nothing to import or update." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      imported,
      updated,
      skipped: body.skippedRows?.length ?? 0,
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
