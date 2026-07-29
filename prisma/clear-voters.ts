import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { join } from "node:path";

dotenv.config({ path: join(process.cwd(), ".env.local") });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const voterCount = await prisma.voter.count();
  const voteCount = await prisma.vote.count();

  if (voterCount === 0) {
    console.log("No voters to remove.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany();
    await tx.candidate.updateMany({ data: { voteCount: 0 } });
    await tx.voter.deleteMany();
  });

  console.log(
    `Removed ${voterCount} voter(s) and ${voteCount} vote record(s). Candidate vote counts reset to 0.`,
  );
  console.log("Wings, positions, candidates, and election settings were kept.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
