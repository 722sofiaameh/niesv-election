import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/phone";

export const WOMENS_WING_SLUG = "womens-wing";

export type VoterEligibilityIdentity = {
  phoneNumber: string;
  memberRegistrationNumber: string;
};

/** Registration numbers like "NOT FOUND" cannot be used for matching. */
export function normalizeRegistrationNumber(input: string): string | null {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed || trimmed.includes("NOT FOUND")) {
    return null;
  }

  const tokenMatch = trimmed.match(/\b(M\d+|FL\d+)\b/i);
  if (tokenMatch) {
    return tokenMatch[1].toUpperCase();
  }

  const compact = trimmed.replace(/\s+/g, "");
  if (/^(M|FL)\d+$/i.test(compact)) {
    return compact.toUpperCase();
  }

  return compact || null;
}

export async function getEligibleRestrictedWingIds(
  voter: VoterEligibilityIdentity,
): Promise<Set<string>> {
  const normalizedReg = normalizeRegistrationNumber(voter.memberRegistrationNumber);

  const orConditions: Array<
    { phoneNumber: string } | { memberRegistrationNumber: string }
  > = [{ phoneNumber: voter.phoneNumber }];

  if (normalizedReg) {
    orConditions.push({ memberRegistrationNumber: normalizedReg });
  }

  const entries = await prisma.wingEligibleVoter.findMany({
    where: { OR: orConditions },
    select: { wingId: true },
  });

  return new Set(entries.map((entry) => entry.wingId));
}

export async function isVoterEligibleForWing(
  voter: VoterEligibilityIdentity,
  wingId: string,
): Promise<boolean> {
  const wing = await prisma.wing.findUnique({
    where: { id: wingId },
    select: { requiresEligibility: true },
  });

  if (!wing?.requiresEligibility) {
    return true;
  }

  const eligibleWingIds = await getEligibleRestrictedWingIds(voter);
  return eligibleWingIds.has(wingId);
}

export async function getVoterEligibilityIdentity(
  voterId: string,
): Promise<VoterEligibilityIdentity | null> {
  return prisma.voter.findUnique({
    where: { id: voterId },
    select: {
      phoneNumber: true,
      memberRegistrationNumber: true,
    },
  });
}

export function normalizeEligibleVoterPhone(input: string): string | null {
  return normalizePhoneNumber(input);
}
