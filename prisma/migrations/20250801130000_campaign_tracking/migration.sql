-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "trackingToken" TEXT;

UPDATE "Candidate"
SET "trackingToken" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
WHERE "trackingToken" IS NULL;

ALTER TABLE "Candidate" ALTER COLUMN "trackingToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_trackingToken_key" ON "Candidate"("trackingToken");

-- AlterTable
ALTER TABLE "ElectionSettings" ADD COLUMN "liveTrackingForManagers" BOOLEAN NOT NULL DEFAULT true;
