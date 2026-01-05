import "dotenv/config"; // load DATABASE_URL
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

// Prisma 7: client must be constructed with an adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  try {
    const jsonPath = path.join(__dirname, "questions.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data.questions)) {
      throw new Error('questions.json must contain a "questions" array');
    }

    console.log(`📚 Found ${data.questions.length} questions`);

    // Clear dependent tables first to avoid FK violations
    await prisma.sessionAttempt.deleteMany({});
    await prisma.session.deleteMany({});
    console.log("🗑️  Cleared sessions and attempts");

    // Clear questions last
    await prisma.question.deleteMany({});
    console.log("🗑️  Cleared existing questions");

    for (const q of data.questions) {
      await prisma.question.create({
        data: {
          // Only include id if it exists in JSON
          ...(q.id && { id: q.id }),

          category: q.category,
          question: q.question,

          // Optional fields with schema defaults
          role: q.role ?? "General",
          difficulty: q.difficulty ?? "Basic",
        },
      });

      console.log(`✅ Seeded: ${q.category} | ${q.role ?? "General"}`);
    }

    console.log("✨ Seeding complete");

    // Verification
    const count = await prisma.question.count();
    console.log(`📊 Total questions in DB: ${count}`);

    const sample = await prisma.question.findFirst();
    console.log("📋 Sample question:", {
      id: sample?.id,
      category: sample?.category,
      role: sample?.role,
      difficulty: sample?.difficulty,
    });
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main()
  .catch(() => process.exit(1))
  .finally(async () => {
    await prisma.$disconnect();
  });
