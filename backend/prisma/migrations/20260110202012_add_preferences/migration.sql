-- CreateTable
CREATE TABLE "Preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultRole" TEXT NOT NULL DEFAULT 'Software Engineering',
    "defaultDifficulty" TEXT NOT NULL DEFAULT 'Basic',
    "focusBehavioral" BOOLEAN NOT NULL DEFAULT true,
    "focusTechnical" BOOLEAN NOT NULL DEFAULT true,
    "focusSystemDesign" BOOLEAN NOT NULL DEFAULT false,
    "autoStartNext" BOOLEAN NOT NULL DEFAULT false,
    "feedbackTone" TEXT NOT NULL DEFAULT 'Encouraging',
    "feedbackDetail" TEXT NOT NULL DEFAULT 'Standard',
    "showSampleAnswer" BOOLEAN NOT NULL DEFAULT true,
    "enableTimer" BOOLEAN NOT NULL DEFAULT false,
    "countdownSeconds" INTEGER NOT NULL DEFAULT 30,
    "autoSubmitOnSilence" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");

-- AddForeignKey
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
