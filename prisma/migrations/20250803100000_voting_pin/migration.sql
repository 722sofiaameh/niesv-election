-- AlterTable
ALTER TABLE "Voter" ADD COLUMN "votingPinHash" TEXT;
ALTER TABLE "Voter" ADD COLUMN "votingPinIssuedAt" TIMESTAMP(3);
