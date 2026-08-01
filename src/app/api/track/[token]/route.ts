import { NextResponse } from "next/server";

import { getCampaignTrackingData } from "@/lib/campaign-tracking-data";

type RouteContext = { params: { token: string } };

export async function GET(_request: Request, context: RouteContext) {
  const token = context.params.token?.trim();
  if (!token) {
    return NextResponse.json({ available: false }, { status: 404 });
  }

  const data = await getCampaignTrackingData(token);

  if (!data.available) {
    return NextResponse.json(data, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
