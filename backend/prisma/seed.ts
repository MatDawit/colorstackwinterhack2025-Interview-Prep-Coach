import { PrismaClient } from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting to seed questions...');

    // Read the questions.json file
    const questionsPath = path.join(__dirname, 'questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf-8');
    const questions = JSON.parse(questionsData);

    // Delete existing questions (optional - only if you want to reset)
    console.log('🗑️  Clearing existing questions...');
    await prisma.question.deleteMany({});

    // Insert questions one by one
    let count = 0;
    for (const q of questions) {
      await prisma.question.create({
        data: {
          category: q.category,
          question: q.question,
          sampleAnswers: q.sampleAnswers || {},
          role: q.role || null, // If you have a role field
        },
      });
      count++;
      console.log(`✅ Seeded question ${count}: ${q.question.substring(0, 50)}...`);
    }

    console.log(`\n🎉 Successfully seeded ${count} questions!`);
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    throw error;
  }
}

// Run the seed function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });