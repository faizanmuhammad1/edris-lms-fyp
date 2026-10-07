"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { AlertCircle, BookOpen, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { checkoutCart, getCart, removeFromCart } from "@/app/actions/cart";

export interface CartItem {
    id: string;
    course: {
        title: string;
        price: number;
        slug?: string;
        fileKey?: string | null;
    };
}

export interface Cart {
    items: CartItem[];
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatPrice = (price: number) => (price === 0 ? "Free" : currency.format(price));

function CartItemRow({
    item,
    removing,
    onRemove,
}: {
    item: CartItem;
    removing: boolean;
    onRemove: (item: CartItem) => void;
}) {
    const href = item.course.slug ? `/courses/${item.course.slug}` : "/courses";

    return (
        <li className="flex items-start gap-3 py-4">
            {/* Icon tile instead of a thumbnail: resolving storage URLs here would pull env validation into every page's JS. */}
            <div
                className="flex aspect-video w-20 shrink-0 items-center justify-center rounded-md border bg-primary/5 text-primary"
                aria-hidden="true"
            >
                <BookOpen className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <SheetClose asChild>
                    <Link
                        href={href}
                        className="line-clamp-2 break-words text-sm font-medium hover:text-primary hover:underline"
                    >
                        {item.course.title}
                    </Link>
                </SheetClose>
                <p className="mt-1 text-sm font-semibold">{formatPrice(item.course.price)}</p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item)}
                disabled={removing}
                aria-label={`Remove ${item.course.title} from cart`}
                className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
            >
                {removing ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                    <Trash2 aria-hidden="true" />
                )}
            </Button>
        </li>
    );
}

export function CartDrawer({ isSignedIn = true }: { isSignedIn?: boolean }) {
    const [cart, setCart] = useState<Cart | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [isCheckingOut, startCheckout] = useTransition();

    const fetchCart = useCallback(async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const data = await getCart();
            setCart(data as unknown as Cart | null);
        } catch (e) {
            console.error(e);
            setLoadError(true);
        }
        setIsLoading(false);
    }, []);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            setCheckoutError(null);
            if (isSignedIn) void fetchCart();
        }
    };

    const handleRemove = async (item: CartItem) => {
        setRemovingId(item.id);
        try {
            const res = await removeFromCart(item.id);
            if (res.status === "success") {
                setCart((prev) =>
                    prev ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) } : prev
                );
                toast.success(`Removed “${item.course.title}” from your cart`);
            } else {
                toast.error(res.message || "Couldn't remove this course. Please try again.");
            }
        } catch {
            toast.error("Couldn't remove this course. Please try again.");
        } finally {
            setRemovingId(null);
        }
    };

    const handleCheckout = () => {
        setCheckoutError(null);
        startCheckout(async () => {
            try {
                const res = await checkoutCart();
                if (res?.status === "success" && res.url) {
                    window.location.href = res.url;
                    return;
                }
                const message =
                    (res && "message" in res && res.message) ||
                    "Checkout couldn't be started. Please try again.";
                setCheckoutError(message);
                toast.error(message);
                void fetchCart();
            } catch {
                const message = "Checkout couldn't be started. Please try again.";
                setCheckoutError(message);
                toast.error(message);
            }
        });
    };

    const items = cart?.items ?? [];
    const itemCount = items.length;
    const total = items.reduce((acc, item) => acc + item.course.price, 0);

    let body: React.ReactNode;
    if (!isSignedIn) {
        body = (
            <CartMessage
                title="Sign in to use your cart"
                description="Save courses to your cart and check out in one go."
                action={
                    <SheetClose asChild>
                        <Link href="/login" className={buttonVariants({ className: "h-10" })}>
                            Sign in
                        </Link>
                    </SheetClose>
                }
            />
        );
    } else if (isLoading && !cart) {
        body = (
            <ul className="flex-1 divide-y px-4" aria-label="Loading cart">
                {[0, 1].map((i) => (
                    <li key={i} className="flex gap-3 py-4">
                        <Skeleton className="aspect-video w-24 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    } else if (loadError) {
        body = (
            <CartMessage
                title="We couldn't load your cart"
                description="Check your connection and try again."
                action={
                    <Button variant="outline" onClick={() => void fetchCart()} className="h-10">
                        Try again
                    </Button>
                }
            />
        );
    } else if (itemCount === 0) {
        body = (
            <CartMessage
                title="Your cart is empty"
                description="Browse the catalog and add courses you'd like to take."
                action={
                    <SheetClose asChild>
                        <Link href="/courses" className={buttonVariants({ className: "h-10" })}>
                            Browse courses
                        </Link>
                    </SheetClose>
                }
            />
        );
    } else {
        body = (
            <>
                <ul className="flex-1 divide-y overflow-y-auto px-4" aria-label="Courses in your cart">
                    {items.map((item) => (
                        <CartItemRow
                            key={item.id}
                            item={item}
                            removing={removingId === item.id}
                            onRemove={handleRemove}
                        />
                    ))}
                </ul>
                <SheetFooter className="border-t bg-muted/30 p-4">
                    <div className="flex items-baseline justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{currency.format(total)}</span>
                    </div>
                    {checkoutError && (
                        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {checkoutError}
                        </p>
                    )}
                    <Button
                        className="h-11 w-full"
                        onClick={handleCheckout}
                        disabled={isCheckingOut || removingId !== null}
                    >
                        {isCheckingOut ? (
                            <>
                                <Loader2 className="animate-spin" aria-hidden="true" />
                                Redirecting to checkout…
                            </>
                        ) : (
                            "Checkout"
                        )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                        Secure payment powered by Stripe
                    </p>
                </SheetFooter>
            </>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-10 text-muted-foreground"
                    aria-label={itemCount > 0 ? `Open cart (${itemCount} item${itemCount === 1 ? "" : "s"})` : "Open cart"}
                >
                    <ShoppingCart className="size-5" aria-hidden="true" />
                    {itemCount > 0 && (
                        <span
                            className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
                            aria-hidden="true"
                        >
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
                <SheetHeader className="border-b p-4 pr-12">
                    <SheetTitle className="text-lg">Your cart</SheetTitle>
                    <SheetDescription>
                        {isSignedIn && itemCount > 0
                            ? `${itemCount} course${itemCount === 1 ? "" : "s"} ready to check out`
                            : "Courses you add will appear here."}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col" aria-busy={isLoading}>
                    {body}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function CartMessage({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="size-7 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-5 text-base font-semibold">{title}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
            <div className="mt-6">{action}</div>
        </div>
    );
}
