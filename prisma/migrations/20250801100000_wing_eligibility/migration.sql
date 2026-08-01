-- AlterTable
ALTER TABLE "Wing" ADD COLUMN "requiresEligibility" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WingEligibleVoter" (
    "id" TEXT NOT NULL,
    "wingId" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "memberRegistrationNumber" TEXT,

    CONSTRAINT "WingEligibleVoter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WingEligibleVoter_wingId_idx" ON "WingEligibleVoter"("wingId");

-- CreateIndex
CREATE INDEX "WingEligibleVoter_memberRegistrationNumber_idx" ON "WingEligibleVoter"("memberRegistrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WingEligibleVoter_wingId_phoneNumber_key" ON "WingEligibleVoter"("wingId", "phoneNumber");

-- AddForeignKey
ALTER TABLE "WingEligibleVoter" ADD CONSTRAINT "WingEligibleVoter_wingId_fkey" FOREIGN KEY ("wingId") REFERENCES "Wing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
