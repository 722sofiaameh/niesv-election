import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

import {
  buildVotingPinCsv,
  generateVotingPinsForVoters,
  getVotingPinStats,
} from "../src/lib/voting-pin-export";

dotenv.config({ path: join(process.cwd(), ".env.local") });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const regenerate = process.argv.includes("--regenerate");
  const statsBefore = await getVotingPinStats();

  const rows = await generateVotingPinsForVoters({ regenerate });

  if (rows.length === 0) {
    console.log(
      regenerate
        ? "No voters found."
        : "Every voter already has a PIN. Pass --regenerate to replace all PINs.",
    );
    return;
  }

  const csv = buildVotingPinCsv(rows);
  const filename = `voting-pins-${new Date().toISOString().slice(0, 10)}.csv`;
  writeFileSync(join(process.cwd(), filename), csv, "utf8");

  const statsAfter = await getVotingPinStats();
  console.log(
    `Generated ${rows.length} voting PIN(s) (${statsBefore.withPin} → ${statsAfter.withPin} voters with PINs).`,
  );
  console.log(`Saved ${filename}`);
  console.log("Share this file securely — PINs cannot be exported again without regenerating.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
