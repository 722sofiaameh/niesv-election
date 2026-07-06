import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import { VOTER_CSV_TEMPLATE } from "@/lib/voter-import";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  return new NextResponse(VOTER_CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="voters-template.csv"',
    },
  });
}
