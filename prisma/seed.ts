import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

type CandidateData = {
  name: string;
};

type PositionData = {
  title: string;
  candidates: CandidateData[] | string[];
};

type WingData = {
  name: string;
  positions: PositionData[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCandidateName(candidate: CandidateData | string): string {
  return typeof candidate === "string" ? candidate : candidate.name;
}

async function main() {
  const filePath = join(process.cwd(), "prisma/data/candidates.json");
  const wings = JSON.parse(readFileSync(filePath, "utf-8")) as WingData[];

  await prisma.vote.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.position.deleteMany();
  await prisma.wing.deleteMany();
  await prisma.voter.deleteMany();
  await prisma.electionSettings.deleteMany();

  for (const wingData of wings) {
    const wing = await prisma.wing.create({
      data: {
        name: wingData.name,
        slug: slugify(wingData.name),
      },
    });

    for (let index = 0; index < wingData.positions.length; index++) {
      const positionData = wingData.positions[index];
      const position = await prisma.position.create({
        data: {
          title: positionData.title,
          order: index + 1,
          wingId: wing.id,
        },
      });

      for (const candidateEntry of positionData.candidates) {
        await prisma.candidate.create({
          data: {
            name: normalizeCandidateName(candidateEntry),
            positionId: position.id,
          },
        });
      }
    }
  }

  await prisma.electionSettings.create({
    data: {
      isVotingOpen: false,
      resultsArePublic: false,
    },
  });

  const wingCount = await prisma.wing.count();
  const positionCount = await prisma.position.count();
  const candidateCount = await prisma.candidate.count();

  console.log(
    `Seeded ${wingCount} wings, ${positionCount} positions, ${candidateCount} candidates.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
