import { NextResponse } from "next/server";

import { getPublicResults } from "@/lib/results-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wing = searchParams.get("wing");
  const results = await getPublicResults(wing);
  return NextResponse.json(results);
}
