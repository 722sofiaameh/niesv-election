import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { join } from "node:path";

dotenv.config({ path: join(process.cwd(), ".env.local") });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const [voteCount, votedVoterCount, voterCount] = await Promise.all([
    prisma.vote.count(),
    prisma.voter.count({ where: { hasVoted: true } }),
    prisma.voter.count(),
  ]);

  if (voteCount === 0 && votedVoterCount === 0) {
    console.log("Nothing to reset — no votes recorded and no voters marked as voted.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany();
    await tx.candidate.updateMany({ data: { voteCount: 0 } });
    await tx.voter.updateMany({ data: { hasVoted: false } });
  });

  console.log(
    `Reset complete: removed ${voteCount} vote record(s), cleared hasVoted on ${votedVoterCount} voter(s).`,
  );
  console.log(
    `${voterCount} voter record(s), wings, positions, candidates, and election settings were kept.`,
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
