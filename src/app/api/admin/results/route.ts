import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  const wings = await prisma.wing.findMany({
    include: {
      positions: {
        orderBy: { order: "asc" },
        include: {
          candidates: { orderBy: { voteCount: "desc" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  if (format === "csv") {
    const lines = [
      "Wing,Position,Candidate,Status,Votes",
    ];

    for (const wing of wings) {
      for (const position of wing.positions) {
        for (const candidate of position.candidates) {
          lines.push(
            [
              escapeCsv(wing.name),
              escapeCsv(position.title),
              escapeCsv(candidate.name),
              candidate.status,
              String(candidate.voteCount),
            ].join(","),
          );
        }
      }
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="election-results.csv"',
      },
    });
  }

  return NextResponse.json({ wings });
}
