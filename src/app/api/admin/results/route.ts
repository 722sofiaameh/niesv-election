import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import {
  buildResultsCsv,
  getAdminResults,
  resultsCsvFilename,
} from "@/lib/results-data";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const wing = searchParams.get("wing");
  const results = await getAdminResults(wing);

  if (format === "csv") {
    return new NextResponse(buildResultsCsv(results.wings), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resultsCsvFilename(wing)}"`,
      },
    });
  }

  return NextResponse.json(results);
}
