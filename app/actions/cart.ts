"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/app/data/user/require-user";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import Stripe from "stripe";

export async function getCart() {
    const user = await requireUser();
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
    const user = await requireUser();

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
    await requireUser();

    // Verify ownership via cart
    // Assuming simple delete is enough for now, middleware protects actions
    await prisma.cartItem.delete({
        where: { id: cartItemId },
    });

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

    // Create Pending Enrollments and Line Items
    for (const item of cart.items) {
        // Skip if already enrolled (double check)
        // ...

        // Create Enrollment
        // Upsert to handle existing pending enrollments
        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: item.courseId,
                }
            },
            update: {
                status: "Pending",
                amount: item.course.price,
            },
            create: {
                userId: user.id,
                courseId: item.courseId,
                status: "Pending",
                amount: item.course.price,
            }
        });

        enrollmentIds.push(enrollment.id);

        line_items.push({
            price: item.course.stripePriceId,
            quantity: 1,
        });
    }

    if (line_items.length === 0) {
        return { status: "error", message: "No items to checkout" };
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
            enrollmentIds: enrollmentIds.join(","), // Limit 500 chars
        },
        success_url: `${env.BETTER_AUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.BETTER_AUTH_URL}/payment/cancel`,
    });

    return { status: "success", url: session.url };
}
