-- AlterTable
ALTER TABLE "Position" ADD COLUMN "maxSelections" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX "Vote_voterId_positionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vote_voterId_positionId_candidateId_key" ON "Vote"("voterId", "positionId", "candidateId");

-- CreateIndex
CREATE INDEX "Vote_voterId_positionId_idx" ON "Vote"("voterId", "positionId");
