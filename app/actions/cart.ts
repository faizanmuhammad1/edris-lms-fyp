"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { encodeEnrollmentIdsMetadata } from "@/lib/checkout-fulfillment";
import Stripe from "stripe";

export async function getCart() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return null;
    }

    const user = session.user;
    const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
            items: {
                include: {
                    course: true,
                },
            },
        },
    });

    if (!cart) {
        return null;
    }

    return cart;
}

export async function addToCart(courseId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        return { status: "error", message: "Please login before adding to cart" };
    }

    const user = session.user;

    const course = await prisma.course.findFirst({
        where: { id: courseId, status: "Published" },
        select: { id: true },
    });
    if (!course) {
        return { status: "error", message: "Course not found" };
    }

    // Create cart if not exists
    let cart = await prisma.cart.findUnique({
        where: { userId: user.id },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId: user.id },
        });
    }

    // Check if course already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
            userId_courseId: {
                userId: user.id,
                courseId: courseId,
            },
        },
    });

    if (existingEnrollment?.status === "Active") {
        return { status: "error", message: "Already enrolled" };
    }

    // Check if item already in cart
    // Using try-catch to handle unique constraint violation gracefully if race condition
    try {
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                courseId: courseId,
            },
        });
    } catch {
        // Ignore unique constraint error
        return { status: "info", message: "Item already in cart" };
    }

    revalidatePath("/cart"); // Assuming we'll have a cart page or drawer
    return { status: "success", message: "Added to cart" };
}

export async function removeFromCart(cartItemId: string) {
    const user = await requireUser();

    // Scoped to the caller's own cart.
    const { count } = await prisma.cartItem.deleteMany({
        where: { id: cartItemId, cart: { userId: user.id } },
    });
    if (count === 0) {
        return { status: "error", message: "Item not found" };
    }

    revalidatePath("/cart");
    return { status: "success", message: "Removed from cart" };
}

export async function checkoutCart() {
    const sessionUser = await requireUser();
    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const cart = await getCart();

    if (!cart || cart.items.length === 0) {
        return { status: "error", message: "Cart is empty" };
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const enrollmentIds: string[] = [];

    const existingEnrollments = await prisma.enrollment.findMany({
        where: { userId: user.id, courseId: { in: cart.items.map((item) => item.courseId) } },
        select: { courseId: true, status: true },
    });
    const activeCourseIds = new Set(
        existingEnrollments.filter((e) => e.status === "Active").map((e) => e.courseId)
    );

    // Drop items the user already owns or that are no longer for sale.
    const staleItemIds = cart.items
        .filter((item) => activeCourseIds.has(item.courseId) || item.course.status !== "Published")
        .map((item) => item.id);
    if (staleItemIds.length > 0) {
        await prisma.cartItem.deleteMany({ where: { id: { in: staleItemIds } } });
    }

    // Create Pending Enrollments and Line Items
    for (const item of cart.items) {
        if (staleItemIds.includes(item.id)) continue;

        // Amounts are stored in cents, matching single-course checkout and Stripe.
        const amountCents = Math.round(Number(item.course.price) * 100);

        // Upsert to handle existing pending enrollments; never touches Active ones (filtered above).
        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: item.courseId,
                }
            },
            update: {
                status: "Pending",
                amount: amountCents,
            },
            create: {
                userId: user.id,
                courseId: item.courseId,
                status: "Pending",
                amount: amountCents,
            }
        });

        enrollmentIds.push(enrollment.id);

        line_items.push({
            price: item.course.stripePriceId,
            quantity: 1,
        });
    }

    if (line_items.length === 0) {
        revalidatePath("/cart");
        return { status: "error", message: "No items to checkout. Courses you already own were removed from your cart." };
    }

    // Ensure Stripe Customer ID exists
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customer.id },
        });
        stripeCustomerId = customer.id;
    }

    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "payment",
        line_items,
        metadata: {
            type: "cart_checkout",
            userId: user.id,
            ...encodeEnrollmentIdsMetadata(enrollmentIds),
        },
        success_url: `${env.BETTER_AUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
    });

    return { status: "success", url: session.url };
}
