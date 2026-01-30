"use client";

import { addToCart } from "@/app/actions/cart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useTransition } from "react";

export function AddToCartButton({ courseId }: { courseId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleAdd = () => {
        startTransition(async () => {
            try {
                const res = await addToCart(courseId);
                if (res.status === 'success') {
                    toast.success(res.message);
                } else if (res.status === 'info') {
                    toast.info(res.message);
                } else {
                    toast.error(res.message);
                }
            } catch {
                toast.error("Failed to add to cart");
            }
        });
    };

    return (
        <Button variant="outline" className="w-full mt-2" onClick={handleAdd} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            Add to Cart
        </Button>
    )
}
