import { getSupportContact } from "@/lib/constants";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";

export async function validateVoterForLogin(normalizedPhone: string) {
  const [voter, settings] = await withDbRetry(() =>
    Promise.all([
      prisma.voter.findUnique({
        where: { phoneNumber: normalizedPhone },
      }),
      prisma.electionSettings.findFirst(),
    ]),
  );

  if (!voter) {
    return {
      ok: false as const,
      status: 404,
      error: `This number isn't registered as a voter. Please contact ${getSupportContact()} if you believe this is a mistake.`,
    };
  }

  if (settings && !settings.isVotingOpen) {
    return {
      ok: false as const,
      status: 403,
      error: "Voting is currently closed. Please check back later.",
    };
  }

  return { ok: true as const, voter, settings };
}

/** Resend cooldown: 60 seconds before another OTP can be sent. */
export const OTP_RESEND_COOLDOWN_MS = 60_000;

export function getOtpResendWaitSeconds(expiresAt: Date | null): number {
  if (!expiresAt) return 0;
  const sentAt = expiresAt.getTime() - 5 * 60 * 1000;
  const elapsed = Date.now() - sentAt;
  const remaining = OTP_RESEND_COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
