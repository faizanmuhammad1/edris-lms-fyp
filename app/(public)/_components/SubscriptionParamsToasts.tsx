"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SubscriptionParamsToasts() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const subscribed = searchParams.get("subscribed");
        const unsubscribed = searchParams.get("unsubscribed");
        const confirm = searchParams.get("confirm");
        const unsubscribe = searchParams.get("unsubscribe");

        if (subscribed === "1") {
            toast.success("You're subscribed.");
            window.history.replaceState({}, "", window.location.pathname);
        } else if (unsubscribed === "1") {
            toast.success("You've been unsubscribed.");
            window.history.replaceState({}, "", window.location.pathname);
        } else if (confirm === "error" || confirm === "invalid") {
            toast.error("Confirmation link invalid or expired.");
            window.history.replaceState({}, "", window.location.pathname);
        } else if (unsubscribe === "error" || unsubscribe === "invalid") {
            toast.error("Unsubscribe link invalid or expired.");
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [searchParams]);

    return null;
}
