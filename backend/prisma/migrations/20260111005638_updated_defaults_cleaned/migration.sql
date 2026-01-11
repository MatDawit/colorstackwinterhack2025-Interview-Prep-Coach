/*
  Warnings:

  - You are about to drop the column `sampleAnswers` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the `Attempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MockInterview` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Preferences" ALTER COLUMN "focusTechnical" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "sampleAnswers",
ALTER COLUMN "role" SET DEFAULT 'Software Engineering';

-- DropTable
DROP TABLE "Attempt";

-- DropTable
DROP TABLE "MockInterview";
