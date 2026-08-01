import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  commitWingEligibilityImport,
  validateWingEligibilityCsv,
} from "../src/lib/wing-eligibility-import";
import { WOMENS_WING_SLUG } from "../src/lib/wing-eligibility";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  const csvPath = join(process.cwd(), "prisma/data/womens-wing-eligible.csv");
  const csvText = readFileSync(csvPath, "utf-8");

  const wing =
    (await prisma.wing.findUnique({ where: { slug: WOMENS_WING_SLUG } })) ??
    (await prisma.wing.findFirst({
      where: { name: { contains: "Women", mode: "insensitive" } },
    }));

  if (!wing) {
    throw new Error(
      `Women's Wing not found. Expected slug "${WOMENS_WING_SLUG}" or a wing name containing "Women".`,
    );
  }

  const validation = validateWingEligibilityCsv(csvText);
  if (validation.validCount === 0) {
    throw new Error("No valid rows found in Women's Wing eligibility CSV.");
  }

  if (validation.invalidCount > 0) {
    console.warn(
      `Skipped ${validation.invalidCount} invalid row(s). Importing ${validation.validCount} eligible voter(s).`,
    );
  }

  const imported = await commitWingEligibilityImport(
    wing.id,
    validation.validRows,
  );

  console.log(
    `Imported ${imported} eligible voter(s) for "${wing.name}" (${wing.slug}).`,
  );
  console.log("Women's Wing ballot access is now restricted to this list.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
