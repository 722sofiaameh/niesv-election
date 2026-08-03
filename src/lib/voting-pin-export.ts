import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  generateVotingPin,
  hashVotingPin,
} from "@/lib/voting-pin";

export type VotingPinRow = {
  name: string;
  phoneNumber: string;
  memberRegistrationNumber: string;
  votingPin: string;
};

const BULK_UPDATE_BATCH_SIZE = 100;

async function bulkPersistVotingPins(
  entries: Array<{ id: string; hash: string }>,
  issuedAt: Date,
) {
  for (let index = 0; index < entries.length; index += BULK_UPDATE_BATCH_SIZE) {
    const batch = entries.slice(index, index + BULK_UPDATE_BATCH_SIZE);
    await prisma.$executeRaw`
      UPDATE "Voter" AS v
      SET
        "votingPinHash" = batch.hash,
        "votingPinIssuedAt" = ${issuedAt}
      FROM (
        VALUES ${Prisma.join(
          batch.map(
            (entry) => Prisma.sql`(${entry.id}, ${entry.hash})`,
          ),
        )}
      ) AS batch(id, hash)
      WHERE v.id = batch.id
    `;
  }
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildVotingPinCsv(rows: VotingPinRow[]): string {
  const header = "name,phoneNumber,memberRegistrationNumber,votingPin";
  const lines = rows.map((row) =>
    [
      escapeCsvField(row.name),
      escapeCsvField(row.phoneNumber),
      escapeCsvField(row.memberRegistrationNumber),
      escapeCsvField(row.votingPin),
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}

export async function getVotingPinStats() {
  const [total, withPin] = await Promise.all([
    prisma.voter.count(),
    prisma.voter.count({ where: { votingPinHash: { not: null } } }),
  ]);

  return {
    total,
    withPin,
    withoutPin: total - withPin,
  };
}

export async function generateVotingPinsForVoters(options: {
  regenerate: boolean;
  voterIds?: string[];
}): Promise<VotingPinRow[]> {
  const voters = await prisma.voter.findMany({
    where: options.voterIds?.length
      ? { id: { in: options.voterIds } }
      : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      memberRegistrationNumber: true,
      votingPinHash: true,
    },
  });

  const issuedAt = new Date();
  const pending = voters
    .filter((voter) => options.regenerate || !voter.votingPinHash)
    .map((voter) => {
      const pin = generateVotingPin();
      return {
        id: voter.id,
        pin,
        row: {
          name: voter.name,
          phoneNumber: voter.phoneNumber,
          memberRegistrationNumber: voter.memberRegistrationNumber,
          votingPin: pin,
        },
      };
    });

  if (pending.length === 0) {
    return [];
  }

  await bulkPersistVotingPins(
    pending.map((entry) => ({
      id: entry.id,
      hash: hashVotingPin(entry.pin),
    })),
    issuedAt,
  );

  return pending.map((entry) => entry.row);
}

export async function issueVotingPinForVoter(voterId: string): Promise<VotingPinRow> {
  const voter = await prisma.voter.findUnique({
    where: { id: voterId },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      memberRegistrationNumber: true,
    },
  });

  if (!voter) {
    throw new Error("Voter not found.");
  }

  const pin = generateVotingPin();
  await prisma.voter.update({
    where: { id: voter.id },
    data: {
      votingPinHash: hashVotingPin(pin),
      votingPinIssuedAt: new Date(),
    },
  });

  return {
    name: voter.name,
    phoneNumber: voter.phoneNumber,
    memberRegistrationNumber: voter.memberRegistrationNumber,
    votingPin: pin,
  };
}
