import { prisma } from "@/lib/prisma";

export async function syncWingEligibleToVoters(wingId: string) {
  const eligible = await prisma.wingEligibleVoter.findMany({
    where: { wingId },
    orderBy: { name: "asc" },
  });

  if (eligible.length === 0) {
    return { created: 0, skipped: 0, total: 0 };
  }

  const existing = await prisma.voter.findMany({
    select: { phoneNumber: true },
  });
  const existingPhones = new Set(existing.map((voter) => voter.phoneNumber));

  const toCreate = eligible
    .filter((row) => !existingPhones.has(row.phoneNumber))
    .map((row) => ({
      name: row.name ?? "Voter",
      phoneNumber: row.phoneNumber,
      memberRegistrationNumber:
        row.memberRegistrationNumber?.trim() || "NOT ON FILE",
    }));

  if (toCreate.length > 0) {
    await prisma.voter.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  return {
    created: toCreate.length,
    skipped: eligible.length - toCreate.length,
    total: eligible.length,
  };
}
