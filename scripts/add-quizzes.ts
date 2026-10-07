import { PrismaClient } from "../lib/generated/prisma";
import { env } from "../lib/env";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

async function addQuizzes() {
  console.log("🌱 Adding quizzes to existing lessons...");

  try {
    // Get all courses
    const courses = await prisma.course.findMany({
      include: {
        chapter: {
          include: {
            lessons: {
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (courses.length === 0) {
      console.log("❌ No courses found. Please seed courses first.");
      return;
    }

    let quizzesAdded = 0;

    for (const course of courses) {
      for (const chapter of course.chapter) {
        if (chapter.lessons.length > 0) {
          const firstLesson = chapter.lessons[0];

          // Check if quiz already exists
          const existingQuiz = await prisma.quiz.findUnique({
            where: {
              lessonId: firstLesson.id,
            },
          });

          if (existingQuiz) {
            console.log(`  ⏭️  Quiz already exists for: ${firstLesson.title}`);
            continue;
          }

          // Create a quiz for this lesson
          await prisma.quiz.create({
            data: {
              title: `${firstLesson.title} - Quiz`,
              description: `Test your knowledge of ${firstLesson.title}`,
              timeLimit: 10, // 10 minutes
              passingScore: 70,
              isPublished: true,
              lessonId: firstLesson.id,
              questions: {
                create: [
                  {
                    question: `What is the main topic of "${firstLesson.title}"?`,
                    position: 1,
                    points: 1,
                    options: {
                      create: [
                        { text: "Introduction to the topic", isCorrect: true, position: 0 },
                        { text: "Advanced concepts", isCorrect: false, position: 1 },
                        { text: "Implementation details", isCorrect: false, position: 2 },
                        { text: "None of the above", isCorrect: false, position: 3 },
                      ],
                    },
                  },
                  {
                    question: "Which of the following best describes the lesson content?",
                    position: 2,
                    points: 1,
                    options: {
                      create: [
                        { text: "Basic concepts and fundamentals", isCorrect: true, position: 0 },
                        { text: "Expert-level techniques", isCorrect: false, position: 1 },
                        { text: "Project implementation", isCorrect: false, position: 2 },
                        { text: "Troubleshooting guide", isCorrect: false, position: 3 },
                      ],
                    },
                  },
                  {
                    question: "How well do you understand this lesson?",
                    position: 3,
                    points: 2,
                    options: {
                      create: [
                        { text: "Completely understand", isCorrect: true, position: 0 },
                        { text: "Partially understand", isCorrect: false, position: 1 },
                        { text: "Need more practice", isCorrect: false, position: 2 },
                        { text: "Did not understand", isCorrect: false, position: 3 },
                      ],
                    },
                  },
                ],
              },
            },
          });
          quizzesAdded++;
          console.log(`  ✅ Created quiz for lesson: ${firstLesson.title}`);
        }
      }
    }

    console.log(`\n🎉 Successfully added ${quizzesAdded} quizzes!`);
    console.log("\n🎯 To see quizzes:");
    console.log("  1. Go to /dashboard/complete-nextjs-15-masterclass");
    console.log("  2. Click on the first lesson of any chapter");
    console.log("  3. Scroll down to see the quiz with timer!");

  } catch (error) {
    console.error("❌ Error adding quizzes:", error);
    throw error;
  }
}

addQuizzes()
  .then(async () => {
    console.log("\n✅ Script completed!");
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Script failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
