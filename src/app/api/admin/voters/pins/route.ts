import { NextResponse } from "next/server";

import { requireAdminSession, unauthorizedResponse } from "@/lib/admin-auth";
import {
  buildVotingPinCsv,
  generateVotingPinsForVoters,
  getVotingPinStats,
} from "@/lib/voting-pin-export";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  const stats = await getVotingPinStats();
  return NextResponse.json(stats);
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorizedResponse();

  let regenerate = false;
  try {
    const body = (await request.json()) as { regenerate?: boolean };
    regenerate = body.regenerate === true;
  } catch {
    // Default: only issue PINs for voters who do not have one yet.
  }

  try {
    const rows = await generateVotingPinsForVoters({ regenerate });

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: regenerate
            ? "No voters found to issue PINs for."
            : "Every voter already has a voting PIN. Use regenerate to replace them and download a new list.",
        },
        { status: 400 },
      );
    }

    const csv = buildVotingPinCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="voting-pins-${stamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("Generate voting PINs failed:", error);
    return NextResponse.json(
      { error: "Could not generate voting PINs. Please try again." },
      { status: 500 },
    );
  }
}
