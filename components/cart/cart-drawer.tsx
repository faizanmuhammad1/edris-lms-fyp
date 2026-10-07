"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { getCart, removeFromCart, checkoutCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CartItem {
    id: string;
    course: {
        title: string;
        price: number;
    };
}

export interface Cart {
    items: CartItem[];
}

export function CartDrawer() {
    const [cart, setCart] = useState<Cart | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingOut, startCheckout] = useTransition();

    const fetchCart = useCallback(async () => {
        setIsLoading(true);
        try {
            // This might fail if schema not updated on server yet
            const data = await getCart();
            // Cast data to Cart if needed, or assume getCart returns generally compatible shape
            // For now, simple cast or just trusting the response structure
            setCart(data as unknown as Cart);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    }, []);

    // Fetch cart when drawer opens
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            void fetchCart();
        }
    };

    const handleRemove = async (id: string) => {
        const res = await removeFromCart(id);
        if (res.status === 'success') {
            fetchCart();
            toast.success("Removed");
        }
    };

    const handleCheckout = () => {
        startCheckout(async () => {
            const res = await checkoutCart();
            if (res.status === 'success' && res.url) {
                window.location.href = res.url;
            } else {
                toast.error(res.message);
            }
        });
    };

    const total = cart?.items.reduce((acc: number, item: CartItem) => acc + item.course.price, 0) || 0;

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <button className="p-2 hover:bg-accent rounded-full transition-colors relative group">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {cart?.items && cart.items.length > 0 && <span className="absolute top-1 right-0.5 h-2 w-2 bg-primary rounded-full ring-2 ring-background" />}
                </button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : !cart || cart.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                        <p>Your cart is empty</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto py-4 space-y-4">
                            {cart.items.map((item: CartItem) => (
                                <div key={item.id} className="flex gap-4 items-start">
                                    <div className="relative h-16 w-24 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                        {/* Placeholder since Course Image is ambiguous */}
                                        <span className="text-xs text-muted-foreground">Image</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium line-clamp-2 text-sm">{item.course.title}</h4>
                                        <p className="text-sm text-primary font-bold mt-1">${item.course.price}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>${total}</span>
                            </div>
                            <Button className="w-full" onClick={handleCheckout} disabled={isCheckingOut}>
                                {isCheckingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Checkout
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
