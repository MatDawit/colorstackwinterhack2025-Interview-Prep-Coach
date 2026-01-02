/*
  Warnings:

  - You are about to drop the column `biasPatterns` on the `SessionAttempt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SessionAttempt" DROP COLUMN "biasPatterns",
ADD COLUMN     "actionableFeedback" TEXT,
ADD COLUMN     "improvedVersion" TEXT;
