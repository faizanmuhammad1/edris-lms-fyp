import fs from "fs";
import path from "path";

// Load .env.local manually for scripts
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  content.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const rawValue = match[2].split("#")[0].trim();
      const value = rawValue.replace(/^["']|["']$/g, ""); // Remove quotes if present
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Imports moved inside seedMockData to ensure env vars are loaded first

async function seedMockData() {
  const { PrismaClient } = await import("../lib/generated/prisma");
  // const { env } = await import("../lib/env");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not found context");
    process.exit(1);
  }
  console.log("🔌 Connecting to:", dbUrl.replace(/:[^:]*@/, ":****@")); // Mask password if present

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

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
      console.log("⚠️ No users found. Creating a mock admin user...");
      testUser = await prisma.user.create({
        data: {
          email: "admin@example.com",
          name: "Admin User",
          emailVerified: true,
          role: "admin",
          image: "https://avatar.vercel.sh/admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log("✅ Created mock admin user: admin@example.com");
    }

    console.log(`✅ Using user: ${testUser.email} (${testUser.name})`);

    // Check if courses already exist
    const existingCourses = await prisma.course.findMany();

    if (existingCourses.length > 0) {
      console.log(`⚠️  Found ${existingCourses.length} existing courses. Skipping seed.`);
      return;
    }

    // Create mock courses with chapters and lessons
    const coursesData = [
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

    for (const courseData of coursesData) {
      const { chapters, ...courseInfo } = courseData;

      // SEQUENTIAL CREATION START
      const course = await prisma.course.create({
        data: { ...courseInfo },
      });
      console.log(`✅ Created course: ${course.title}`);

      for (const chapter of chapters) {
        const createdChapter = await prisma.chapter.create({
          data: {
            title: chapter.title,
            position: chapter.position,
            courseId: course.id
          }
        });

        for (const lesson of chapter.lessons) {
          const createdLesson = await prisma.lesson.create({
            data: {
              title: lesson.title,
              description: lesson.description,
              position: lesson.position,
              videoKey: lesson.videoKey,
              thumbnailKey: lesson.thumbnailKey,
              chapterId: createdChapter.id
            }
          });

          // Create quiz for first lesson of each chapter
          if (lesson.position === 1) {
            const quiz = await prisma.quiz.create({
              data: {
                title: `${createdLesson.title} - Quiz`,
                description: `Test your knowledge of ${createdLesson.title}`,
                timeLimit: 10,
                passingScore: 70,
                isPublished: true,
                lessonId: createdLesson.id
              }
            });

            // Create Questions Sequentially
            const questions = [
              { q: "Question 1", p: 1, pts: 1 },
              { q: "Question 2", p: 2, pts: 1 },
              { q: "Question 3", p: 3, pts: 2 }
            ];

            for (const q of questions) {
              const question = await prisma.quizQuestion.create({
                data: {
                  question: q.q,
                  position: q.p,
                  points: q.pts,
                  quizId: quiz.id
                }
              });

              // Options
              const options = [
                { t: "Option A", c: true, p: 0 },
                { t: "Option B", c: false, p: 1 },
                { t: "Option C", c: false, p: 2 },
                { t: "Option D", c: false, p: 3 }
              ];

              for (const opt of options) {
                await prisma.quizOption.create({
                  data: {
                    text: opt.t,
                    isCorrect: opt.c,
                    position: opt.p,
                    questionId: question.id
                  }
                });
              }
            }
            console.log(`  ✅ Created quiz for lesson: ${createdLesson.title}`);
          }
        }
      }
      // SEQUENTIAL CREATION END

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
    }

    console.log("🎉 Mock data seeded successfully!");
    console.log("\n📚 Created courses:");
    console.log("  1. Complete Next.js 15 Masterclass");
    console.log("  2. React Fundamentals");
    console.log("  3. TypeScript for JavaScript Developers");

  } catch (error) {
    console.error("❌ Error seeding mock data:", error);
    throw error;
  }
}

seedMockData()
  .then(() => {
    console.log("\n✅ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
