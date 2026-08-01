import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { join } from "node:path";

dotenv.config({ path: join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  const { syncWingEligibleToVoters } = await import("../src/lib/sync-wing-voters");
  const { WOMENS_WING_SLUG } = await import("../src/lib/wing-eligibility");

  const wing =
    (await prisma.wing.findUnique({ where: { slug: WOMENS_WING_SLUG } })) ??
    (await prisma.wing.findFirst({
      where: { name: { contains: "Women", mode: "insensitive" } },
    }));

  if (!wing) {
    throw new Error("Women's Wing not found.");
  }

  const result = await syncWingEligibleToVoters(wing.id);
  console.log(
    `Registered ${result.created} new voter(s) for login (${result.skipped} already existed, ${result.total} on Women's Wing list).`,
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
