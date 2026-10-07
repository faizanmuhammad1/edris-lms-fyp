"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { ApiResponse } from "@/lib/types";
import { request } from "@arcjet/next";
import { redirect, unstable_rethrow } from "next/navigation";
import Stripe from "stripe";

const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 5,
  })
);

export async function enrollInCourseAction(
  courseId: string
): Promise<ApiResponse | never> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { status: "error", message: "Please login before enrolling" };
  }

  const user = session.user;

  let checkoutUrl: string;
  try {
    const req = await request();
    const decision = await aj.protect(req, {
      fingerprint: user.id,
    });

    if (decision.isDenied()) {
      return {
        status: "error",
        message: "You have been blocked",
      };
    }
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        status: "Published",
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
        stripePriceId: true,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    let stripeCustomerId: string;
    const userWithStripeCustomerId = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        stripeCustomerId: true,
      },
    });

    if (userWithStripeCustomerId?.stripeCustomerId) {
      stripeCustomerId = userWithStripeCustomerId.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeCustomerId: stripeCustomerId,
        },
      });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      select: {
        status: true,
        id: true,
      },
    });

    if (existingEnrollment?.status === "Active") {
      return redirect(`/dashboard/${course.slug}`);
    }

    // Store amount in cents (Stripe uses cents; course.price is in dollars)
    const amountCents = Math.round(Number(course.price) * 100);

    // Commit the pending enrollment before creating the Stripe session, so the
    // enrollmentId in the session metadata always exists when the webhook fires.
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {
        amount: amountCents,
        status: "Pending",
      },
      create: {
        userId: user.id,
        courseId: course.id,
        amount: amountCents,
        status: "Pending",
      },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: course.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${env.BETTER_AUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        courseId: course.id,
        enrollmentId: enrollment.id,
      },
    });

    if (!checkoutSession.url) {
      return { status: "error", message: "Failed to start checkout" };
    }
    checkoutUrl = checkoutSession.url;
  } catch (error) {
    // Let redirect() (already-enrolled case) propagate instead of reporting a failure.
    unstable_rethrow(error);
    if (error instanceof Stripe.errors.StripeError) {
      return {
        status: "error",
        message: "Payment system error. Please try again later.",
      };
    }

    return {
      status: "error",
      message: "Failed to enroll in course",
    };
  }

  redirect(checkoutUrl);
}
