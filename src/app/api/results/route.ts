import { NextResponse } from "next/server";

import { getPublicResults } from "@/lib/results-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await getPublicResults();
  return NextResponse.json(results);
}
