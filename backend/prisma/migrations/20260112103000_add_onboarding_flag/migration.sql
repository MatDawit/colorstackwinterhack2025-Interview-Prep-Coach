-- Add onboardingCompleted flag to User
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT FALSE;