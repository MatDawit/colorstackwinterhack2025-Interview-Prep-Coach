-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "currentQuestionId" TEXT;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_currentQuestionId_fkey" FOREIGN KEY ("currentQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
