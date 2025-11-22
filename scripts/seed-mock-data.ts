import { PrismaClient } from "../lib/generated/prisma";
import { env } from "../lib/env";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

async function seedMockData() {
  console.log("🌱 Starting to seed mock data...");

  try {
    // Get the first admin user or any user from the database
    let testUser = await prisma.user.findFirst({
      where: {
        role: "admin",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // If no admin, get any user
    if (!testUser) {
      testUser = await prisma.user.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });
    }

    if (!testUser) {
      console.error("❌ No users found in database. Please create a user first (login/signup).");
      console.log("💡 Tip: Create an account through the login page first, then run this script.");
      process.exit(1);
    }

    console.log(`✅ Using user: ${testUser.email} (${testUser.name})`);

    // Check if courses already exist
    const existingCourses = await prisma.course.findMany();
    
    if (existingCourses.length > 0) {
      console.log(`⚠️  Found ${existingCourses.length} existing courses. Skipping seed.`);
      return;
    }

    // Create mock courses with chapters and lessons
    const courses = [
      {
        title: "Complete Next.js 15 Masterclass",
        description: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Master Next.js 15 from the ground up. Learn about App Router, Server Components, Server Actions, and all the latest features. Build full-stack applications with React and Next.js.",
                },
              ],
            },
          ],
        }),
        smallDescription: "Master Next.js 15 from the ground up. Learn about App Router, Server Components, and build full-stack applications.",
        slug: "complete-nextjs-15-masterclass",
        fileKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png", // Fallback thumbnail
        price: 9900, // $99.00
        duration: 24,
        level: "Intermediate" as const,
        category: "Development",
        status: "Published" as const,
        stripePriceId: `price_${Math.random().toString(36).substring(7)}`,
        userId: testUser.id,
        chapters: [
          {
            title: "Introduction to Next.js 15",
            position: 1,
            lessons: [
              {
                title: "What is Next.js and Why Use It?",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn the fundamentals of Next.js and understand why it's become the go-to framework for React applications.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-1",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Setting Up Your Development Environment",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Set up your development environment with Node.js, npm, and VS Code. Learn how to create your first Next.js project.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-2",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Understanding the App Router",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Dive deep into the App Router architecture and learn how routing works in Next.js 15.",
                        },
                      ],
                    },
                  ],
                }),
                position: 3,
                videoKey: "sample-video-key-3",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
          {
            title: "Server Components & Server Actions",
            position: 2,
            lessons: [
              {
                title: "Introduction to Server Components",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn about Server Components and how they improve performance and reduce bundle size.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-4",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Working with Server Actions",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Master Server Actions for form handling and data mutations without API routes.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-5",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Data Fetching Patterns",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn different patterns for fetching data in Next.js including static generation, server-side rendering, and incremental static regeneration.",
                        },
                      ],
                    },
                  ],
                }),
                position: 3,
                videoKey: "sample-video-key-6",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
          {
            title: "Building a Full-Stack Application",
            position: 3,
            lessons: [
              {
                title: "Setting Up the Database",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Set up Prisma with PostgreSQL and learn database schema design.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-7",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Authentication with Better Auth",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Implement authentication using Better Auth with email and social providers.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-8",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "File Uploads with S3",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn how to handle file uploads and store them in S3-compatible storage.",
                        },
                      ],
                    },
                  ],
                }),
                position: 3,
                videoKey: "sample-video-key-9",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Deploying to Production",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Deploy your Next.js application to Vercel and configure environment variables.",
                        },
                      ],
                    },
                  ],
                }),
                position: 4,
                videoKey: "sample-video-key-10",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
        ],
      },
      {
        title: "React Fundamentals",
        description: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Learn React from scratch. Understand components, hooks, state management, and build interactive user interfaces.",
                },
              ],
            },
          ],
        }),
        smallDescription: "Learn React from scratch. Understand components, hooks, state management, and build interactive UIs.",
        slug: "react-fundamentals",
        fileKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
        price: 4900, // $49.00
        duration: 16,
        level: "Beginner" as const,
        category: "Development",
        status: "Published" as const,
        stripePriceId: `price_${Math.random().toString(36).substring(7)}`,
        userId: testUser.id,
        chapters: [
          {
            title: "Getting Started with React",
            position: 1,
            lessons: [
              {
                title: "Introduction to React",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn what React is and why it's so popular for building user interfaces.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-11",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Your First React Component",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Create your first React component and understand JSX syntax.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-12",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
          {
            title: "State and Props",
            position: 2,
            lessons: [
              {
                title: "Understanding Props",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn how to pass data between components using props.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-13",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "State Management with useState",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Master the useState hook to manage component state.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-14",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
        ],
      },
      {
        title: "TypeScript for JavaScript Developers",
        description: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Master TypeScript and add type safety to your JavaScript projects. Learn types, interfaces, generics, and advanced TypeScript features.",
                },
              ],
            },
          ],
        }),
        smallDescription: "Master TypeScript and add type safety to your JavaScript projects. Learn types, interfaces, and generics.",
        slug: "typescript-for-javascript-developers",
        fileKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
        price: 7900, // $79.00
        duration: 18,
        level: "Intermediate" as const,
        category: "Development",
        status: "Published" as const,
        stripePriceId: `price_${Math.random().toString(36).substring(7)}`,
        userId: testUser.id,
        chapters: [
          {
            title: "TypeScript Basics",
            position: 1,
            lessons: [
              {
                title: "Why TypeScript?",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Understand the benefits of TypeScript and when to use it in your projects.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-15",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Basic Types and Annotations",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn about basic TypeScript types and how to annotate variables, functions, and objects.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-16",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Interfaces and Types",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Master interfaces and type aliases to create reusable type definitions.",
                        },
                      ],
                    },
                  ],
                }),
                position: 3,
                videoKey: "sample-video-key-17",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
          {
            title: "Advanced TypeScript",
            position: 2,
            lessons: [
              {
                title: "Generics",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Learn how to use generics to create flexible and reusable code.",
                        },
                      ],
                    },
                  ],
                }),
                position: 1,
                videoKey: "sample-video-key-18",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
              {
                title: "Utility Types",
                description: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Explore TypeScript utility types like Pick, Omit, Partial, and Required.",
                        },
                      ],
                    },
                  ],
                }),
                position: 2,
                videoKey: "sample-video-key-19",
                thumbnailKey: "/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png",
              },
            ],
          },
        ],
      },
    ];

    for (const courseData of courses) {
      const { chapters, ...courseInfo } = courseData;
      
      const course = await prisma.course.create({
        data: {
          ...courseInfo,
          chapter: {
            create: chapters.map((chapter) => ({
              title: chapter.title,
              position: chapter.position,
              lessons: {
                create: chapter.lessons.map((lesson) => ({
                  title: lesson.title,
                  description: lesson.description,
                  position: lesson.position,
                  videoKey: lesson.videoKey,
                  thumbnailKey: lesson.thumbnailKey,
                })),
              },
            })),
          },
        },
        include: {
          chapter: {
            include: {
              lessons: true,
            },
          },
        },
      });

      console.log(`✅ Created course: ${course.title} with ${course.chapter.length} chapters`);

      // Create enrollment for test user
      await prisma.enrollment.create({
        data: {
          userId: testUser.id,
          courseId: course.id,
          amount: course.price,
          status: "Active",
        },
      });
      console.log(`✅ Created enrollment for: ${course.title}`);

      // Create quizzes for the first lesson of each chapter
      for (const chapter of course.chapter) {
        if (chapter.lessons.length > 0) {
          const firstLesson = chapter.lessons[0];
          
          // Create a quiz for this lesson
          const quiz = await prisma.quiz.create({
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
          console.log(`  ✅ Created quiz for lesson: ${firstLesson.title}`);
        }
      }
    }

    console.log("🎉 Mock data seeded successfully!");
    console.log("\n📚 Created courses:");
    console.log("  1. Complete Next.js 15 Masterclass");
    console.log("     - Slug: complete-nextjs-15-masterclass");
    console.log("     - 3 chapters, 10 lessons");
    console.log("     - 📝 Quizzes added to first lesson of each chapter");
    console.log("  2. React Fundamentals");
    console.log("     - Slug: react-fundamentals");
    console.log("     - 2 chapters, 4 lessons");
    console.log("     - 📝 Quizzes added to first lesson of each chapter");
    console.log("  3. TypeScript for JavaScript Developers");
    console.log("     - Slug: typescript-for-javascript-developers");
    console.log("     - 2 chapters, 5 lessons");
    console.log("     - 📝 Quizzes added to first lesson of each chapter");
    console.log("\n💡 You can now view courses at:");
    console.log("  - /courses (public course listing)");
    console.log("  - /courses/complete-nextjs-15-masterclass (course details)");
    console.log("  - /dashboard/complete-nextjs-15-masterclass (student dashboard with sidebar)");
    console.log("  - /admin/courses (admin panel)");
    console.log("\n📝 Note: You need to be logged in to view courses in the dashboard.");
    console.log("\n🎯 To see quizzes:");
    console.log("  1. Go to /dashboard/complete-nextjs-15-masterclass");
    console.log("  2. Click on the first lesson of any chapter");
    console.log("  3. Scroll down to see the quiz with timer!");
    
  } catch (error) {
    console.error("❌ Error seeding mock data:", error);
    throw error;
  }
}

seedMockData()
  .then(async () => {
    console.log("\n✅ Seed completed!");
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

