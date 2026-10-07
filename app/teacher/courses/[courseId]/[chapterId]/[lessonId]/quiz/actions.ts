"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateQuizQuestionsFromTranscript,
  type QuizGenerateOptions,
  type GeneratedQuestion,
} from "@/lib/generate-quiz-questions";

// -----------------------------------------------------------------------------
// VALIDATION
// -----------------------------------------------------------------------------

type QuestionInput = {
    question: string;
    points?: number;
    options: { id?: string; text: string; isCorrect: boolean }[];
};

/** Returns an error message if the question could never be graded/passed correctly. */
function validateQuestionInput(data: QuestionInput): string | null {
    if (!data.question || !data.question.trim()) return "Question text is required";
    const points = data.points ?? 1;
    if (!Number.isInteger(points) || points < 1) {
        return "Points must be a whole number of at least 1";
    }
    if (!Array.isArray(data.options) || data.options.length < 2) {
        return "A question must have at least 2 options";
    }
    if (data.options.some((opt) => !opt.text || !opt.text.trim())) {
        return "All options must have text";
    }
    if (data.options.filter((opt) => opt.isCorrect).length !== 1) {
        return "Exactly one option must be marked correct";
    }
    return null;
}

// -----------------------------------------------------------------------------
// QUIZ ACTIONS
// -----------------------------------------------------------------------------

export async function upsertQuiz(
    lessonId: string,
    data: {
        title: string;
        description?: string;
        isPublished?: boolean;
        passingScore?: number;
    }
) {
    const session = await requireTeacher();

    // 1. Verify Ownership
    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: { Course: { userId: session.user.id } },
        },
        include: { Chapter: true },
    });

    if (!lesson) throw new Error("Unauthorized or Lesson not found");

    if (
        data.passingScore !== undefined &&
        (!Number.isInteger(data.passingScore) || data.passingScore < 0 || data.passingScore > 100)
    ) {
        return { success: false as const, error: "Passing score must be a whole number between 0 and 100" };
    }

    // 2. A published quiz must be passable: at least one question, each worth >= 1 point
    //    with exactly one correct option.
    if (data.isPublished) {
        const existingQuiz = await prisma.quiz.findUnique({
            where: { lessonId },
            select: {
                questions: {
                    select: { points: true, options: { select: { isCorrect: true } } },
                },
            },
        });
        const questions = existingQuiz?.questions ?? [];
        if (questions.length === 0) {
            return { success: false as const, error: "Add at least one question before publishing the quiz" };
        }
        const invalidCount = questions.filter(
            (q) =>
                q.points < 1 ||
                q.options.length < 2 ||
                q.options.filter((o) => o.isCorrect).length !== 1
        ).length;
        if (invalidCount > 0) {
            return {
                success: false as const,
                error: `${invalidCount} question(s) need exactly one correct option and at least 1 point before publishing`,
            };
        }
    }

    // 3. Upsert Quiz
    const quiz = await prisma.quiz.upsert({
        where: { lessonId },
        create: {
            lessonId,
            title: data.title,
            description: data.description,
            isPublished: data.isPublished ?? false,
            passingScore: data.passingScore ?? 70,
        },
        update: {
            title: data.title,
            description: data.description,
            isPublished: data.isPublished,
            passingScore: data.passingScore,
        },
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}/quiz`);
    return { success: true as const, quiz };
}

export async function deleteQuiz(lessonId: string) {
    const session = await requireTeacher();

    const lesson = await prisma.lesson.findFirst({
        where: {
            id: lessonId,
            Chapter: { Course: { userId: session.user.id } },
        },
        include: { Chapter: true },
    });

    if (!lesson) throw new Error("Unauthorized or Lesson not found");

    await prisma.quiz.delete({
        where: { lessonId }
    });

    revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/${lesson.chapterId}/${lessonId}`);
    return { success: true };
}


// -----------------------------------------------------------------------------
// QUESTION ACTIONS
// -----------------------------------------------------------------------------

export async function createQuestion(
    quizId: string,
    data: {
        question: string;
        points?: number;
        options: { text: string; isCorrect: boolean }[];
    }
) {
    const session = await requireTeacher();

    // 1. Verify Quiz + Ownership
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
    });

    if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Quiz not found");
    }

    const validationError = validateQuestionInput(data);
    if (validationError) {
        return { success: false, error: validationError };
    }

    // 2. Get Max Position
    const maxPos = await prisma.quizQuestion.findFirst({
        where: { quizId },
        orderBy: { position: "desc" },
        select: { position: true },
    });

    // 3. Create Question with Options
    await prisma.quizQuestion.create({
        data: {
            quizId,
            question: data.question.trim(),
            points: data.points ?? 1,
            position: (maxPos?.position ?? 0) + 1,
            options: {
                create: data.options.map((opt, idx) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    position: idx + 1,
                })),
            },
        },
    });

    revalidatePath(`/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`);
    return { success: true };
}

export async function updateQuestion(
    questionId: string,
    data: {
        question: string;
        points?: number;
        // `id` identifies an existing option so it is updated in place; options without
        // an id are created. Existing options not present are deleted.
        options: { id?: string; text: string; isCorrect: boolean }[];
    }
) {
    const session = await requireTeacher();

    const existing = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: {
            options: { select: { id: true } },
            Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } },
        },
    });

    if (!existing || existing.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Question not found");
    }

    const validationError = validateQuestionInput(data);
    if (validationError) {
        return { success: false, error: validationError };
    }

    // Update options in place (by id) so QuizAnswer.optionId references from past
    // attempts stay valid; only create new options / delete removed ones.
    const existingIds = new Set(existing.options.map((o) => o.id));
    const keptIds = new Set<string>();
    const plan = data.options.map((opt, idx) => {
        const keep = !!opt.id && existingIds.has(opt.id) && !keptIds.has(opt.id);
        if (keep) keptIds.add(opt.id!);
        return {
            id: keep ? opt.id! : null,
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            position: idx + 1,
        };
    });

    await prisma.$transaction(async (tx) => {
        await tx.quizQuestion.update({
            where: { id: questionId },
            data: {
                question: data.question.trim(),
                points: data.points ?? 1,
            },
        });

        await tx.quizOption.deleteMany({
            where: { questionId, id: { notIn: Array.from(keptIds) } },
        });

        // Move kept options to temporary positions first to avoid
        // @@unique([questionId, position]) collisions while reordering.
        let tempPosition = -1;
        for (const id of keptIds) {
            await tx.quizOption.update({ where: { id }, data: { position: tempPosition-- } });
        }

        for (const opt of plan) {
            if (opt.id) {
                await tx.quizOption.update({
                    where: { id: opt.id },
                    data: { text: opt.text, isCorrect: opt.isCorrect, position: opt.position },
                });
            } else {
                await tx.quizOption.create({
                    data: {
                        questionId,
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                        position: opt.position,
                    },
                });
            }
        }
    });

    revalidatePath(
        `/teacher/courses/${existing.Quiz.Lesson.Chapter.courseId}/${existing.Quiz.Lesson.chapterId}/${existing.Quiz.lessonId}/quiz`
    );
    return { success: true };
}

export async function deleteQuestion(questionId: string) {
    const session = await requireTeacher();

    // 1. Verify Ownership
    const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: { Quiz: { include: { Lesson: { include: { Chapter: { include: { Course: true } } } } } } }
    });

    if (!question || question.Quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    // A published quiz must keep at least one question (otherwise it can never be passed)
    if (question.Quiz.isPublished) {
        const questionCount = await prisma.quizQuestion.count({ where: { quizId: question.quizId } });
        if (questionCount <= 1) {
            return {
                success: false,
                error: "Unpublish the quiz before deleting its last question",
            };
        }
    }

    // 2. Delete
    await prisma.quizQuestion.delete({ where: { id: questionId } });

    revalidatePath(`/teacher/courses/${question.Quiz.Lesson.Chapter.courseId}/${question.Quiz.Lesson.chapterId}/${question.Quiz.lessonId}/quiz`);
    return { success: true };
}

export async function updateQuestionOrder(quizId: string, items: { id: string; position: number }[]) {
    const session = await requireTeacher();
    // Verify the teacher owns this quiz
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
    });

    if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
        throw new Error("Unauthorized or Quiz not found");
    }

    // Scope every update to this quiz so client-supplied ids from other quizzes are ignored
    const transaction = items.map((item) =>
        prisma.quizQuestion.updateMany({
            where: { id: item.id, quizId },
            data: { position: item.position }
        })
    );

    await prisma.$transaction(transaction);
    revalidatePath(`/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`);
    return { success: true };
}

// -----------------------------------------------------------------------------
// AI QUIZ GENERATION
// -----------------------------------------------------------------------------

export type GenerateQuizQuestionsResult =
  | { success: true; questions: GeneratedQuestion[] }
  | { success: false; error: "NO_TRANSCRIPT" | "GENERATION_FAILED" };

export async function generateQuizQuestions(
  lessonId: string,
  options: QuizGenerateOptions
): Promise<GenerateQuizQuestionsResult> {
  const session = await requireTeacher();

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      Chapter: { Course: { userId: session.user.id } },
    },
    select: {
      id: true,
      transcript: true,
      transcriptionStatus: true,
      chapterId: true,
      Chapter: { select: { courseId: true } },
    },
  });

  if (!lesson) {
    return { success: false, error: "GENERATION_FAILED" };
  }

  if (lesson.transcriptionStatus !== "COMPLETED" || !lesson.transcript?.trim()) {
    return { success: false, error: "NO_TRANSCRIPT" };
  }

  try {
    const questions = await generateQuizQuestionsFromTranscript(lessonId, options);
    return { success: true, questions };
  } catch {
    return { success: false, error: "GENERATION_FAILED" };
  }
}

export async function addGeneratedQuestions(
  quizId: string,
  questions: GeneratedQuestion[]
): Promise<{ success: boolean; error?: string }> {
  const session = await requireTeacher();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { Lesson: { include: { Chapter: { include: { Course: true } } } } },
  });

  if (!quiz || quiz.Lesson.Chapter.Course.userId !== session.user.id) {
    return { success: false, error: "Unauthorized or Quiz not found" };
  }

  if (questions.length === 0) {
    return { success: true };
  }

  const invalid = questions.find((q) => validateQuestionInput({ ...q, points: 1 }) !== null);
  if (invalid) {
    return {
      success: false,
      error: "Every question needs text and at least 2 options with exactly one correct answer",
    };
  }

  const maxPos = await prisma.quizQuestion.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let nextPosition = (maxPos?.position ?? 0) + 1;

  for (const q of questions) {
    await prisma.quizQuestion.create({
      data: {
        quizId,
        question: q.question,
        points: 1,
        position: nextPosition++,
        options: {
          create: q.options.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            position: idx + 1,
          })),
        },
      },
    });
  }

  revalidatePath(
    `/teacher/courses/${quiz.Lesson.Chapter.courseId}/${quiz.Lesson.chapterId}/${quiz.lessonId}/quiz`
  );
  return { success: true };
}
