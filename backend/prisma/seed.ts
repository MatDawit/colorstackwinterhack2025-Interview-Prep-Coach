import { PrismaClient } from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper: Force STAR order (Situation, Task, Action, Result)
function ensureSTAROrder(sampleAnswers: any) {
  return {
    situation: sampleAnswers.situation,
    task: sampleAnswers.task,
    action: sampleAnswers.action,
    result: sampleAnswers.result
  };
}

async function main() {
  console.log('🌱 Starting seed...');
  
  try {
    const jsonPath = path.join(__dirname, 'questions.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    console.log(`📚 Found ${data.questions.length} questions to seed`);
    
    await prisma.question.deleteMany({});
    console.log('🗑️  Cleared existing questions');
    
    // Insert in order
    for (const question of data.questions) {
      await prisma.question.create({
        data: {
          id: question.id,
          category: question.category,
          question: question.question,
          sampleAnswers: ensureSTAROrder(question.sampleAnswers)  // ← Force STAR order
        }
      });
      console.log(`✅ Created: ${question.id} - ${question.category}`);
    }
    
    console.log('✨ Seeding complete!');
    console.log(`📊 Total questions in database: ${data.questions.length}`);
    
    // Verify STAR order
    console.log('\n📋 Verifying STAR order in first question:');
    const firstQuestion = await prisma.question.findUnique({
      where: { id: 'q1_teamwork_01' }
    });
    
    const sampleAnswers = firstQuestion?.sampleAnswers as any;
    const keys = Object.keys(sampleAnswers || {});
    console.log('Key order in database:', keys.join(', '));
    
    if (keys[0] === 'situation' && keys[1] === 'task' && keys[2] === 'action' && keys[3] === 'result') {
      console.log('✅ STAR order preserved!');
    } else {
      console.log('⚠️  Order changed by database (this is normal for JSONB)');
    }
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });