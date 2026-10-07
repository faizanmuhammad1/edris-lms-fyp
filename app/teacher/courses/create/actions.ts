"use server";

import { requireTeacher } from "@/app/data/teacher/require-teacher";
import arcjet, { fixedWindow } from "@/lib/arcjet";

import { prisma } from "@/lib/db";
import { normalizeCourseName } from "@/lib/course-name";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function CreateTeacherCourse(
  values: CourseSchemaType
): Promise<ApiResponse<{ id: string }>> {
  const session = await requireTeacher();

  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "You're creating courses too quickly. Please wait a minute and try again.",
        };
      } else {
        return {
          status: "error",
          message: "Your request was blocked. If this keeps happening, please contact support.",
        };
      }
    }

    const validation = courseSchema.safeParse(values);

    if (!validation.success) {
      return {
        status: "error",
        message: "Some fields are invalid. Please check the form and try again.",
      };
    }

    // Check slug uniqueness before creating any Stripe objects (avoids orphan products)
    const slugTaken = await prisma.course.findUnique({
      where: { slug: validation.data.slug },
      select: { id: true },
    });
    if (slugTaken) {
      return {
        status: "error",
        message: "This slug is already used by another course. Please choose a different slug.",
      };
    }

    const data = await stripe.products.create({
      name: validation.data.title,
      description: validation.data.smallDescription,
      default_price_data: {
        currency: "usd",
        // price is whole dollars (Int); Stripe expects integer cents
        unit_amount: Math.round(validation.data.price * 100),
      },
    });

    let courseId: string;
    try {
      const created = await prisma.course.create({
        data: {
          ...validation.data,
          normalizedName: normalizeCourseName(validation.data.title),
          userId: session.user.id,
          stripePriceId: data.default_price as string,
        },
        select: { id: true },
      });
      courseId = created.id;
    } catch (dbError) {
      // Don't leave an orphaned, purchasable Stripe product behind
      await stripe.products.update(data.id, { active: false }).catch(() => {});
      throw dbError;
    }

    revalidatePath("/teacher/courses");
    revalidatePath("/teacher");

    return {
      status: "success",
      message: "Course created",
      data: { id: courseId },
    };
  } catch (err) {
    const e = err as { code?: string; meta?: { target?: unknown } } | null;
    if (e?.code === "P2002" && JSON.stringify(e.meta?.target ?? "").includes("slug")) {
      return {
        status: "error",
        message: "This slug is already used by another course. Please choose a different slug.",
      };
    }
    console.error("[CreateTeacherCourse] Error creating course:", err);
    return {
      status: "error",
      message: "We couldn't create the course. Please try again.",
    };
  }
}

