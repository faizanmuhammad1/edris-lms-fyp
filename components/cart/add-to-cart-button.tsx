"use client";

import { addToCart } from "@/app/actions/cart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AddToCartButton({ courseId }: { courseId: string }) {
    const [isPending, startTransition] = useTransition();
    const [inCart, setInCart] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const handleAdd = () => {
        startTransition(async () => {
            try {
                const res = await addToCart(courseId);
                if (res.status === "success") {
                    setInCart(true);
                    toast.success("Added to your cart");
                } else if (res.status === "info") {
                    setInCart(true);
                    toast.info(res.message);
                } else {
                    const needsLogin = /log ?in/i.test(res.message);
                    toast.error(
                        res.message,
                        needsLogin
                            ? {
                                  action: {
                                      label: "Sign in",
                                      onClick: () =>
                                          router.push(`/login?callbackURL=${encodeURIComponent(pathname)}`),
                                  },
                              }
                            : undefined
                    );
                }
            } catch {
                toast.error("Couldn't add this course to your cart. Please try again.");
            }
        });
    };

    return (
        <Button
            variant="outline"
            size="lg"
            className="h-11 w-full"
            onClick={handleAdd}
            disabled={isPending || inCart}
        >
            {isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
            ) : inCart ? (
                <Check aria-hidden="true" />
            ) : (
                <ShoppingCart aria-hidden="true" />
            )}
            {inCart ? "In your cart" : "Add to cart"}
        </Button>
    );
}
