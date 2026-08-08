"use client";

import { useEffect, useRef } from "react";
import { reconcileSuccessfulCheckout, reconcileFromSessionOnly } from "./actions";

interface ReconcilePaymentProps {
    sessionId: string;
    userId: string | null;
}

export function ReconcilePayment({ sessionId, userId }: ReconcilePaymentProps) {
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        async function reconcile() {
            try {
                if (userId) {
                    await reconcileSuccessfulCheckout(sessionId, userId);
                } else {
                    // Auth cookie may be missing after Stripe redirect; reconcile using session_id only
                    await reconcileFromSessionOnly(sessionId);
                }
            } catch (error) {
                console.error("Payment success reconciliation failed", error);
            }
        }

        reconcile();
    }, [sessionId, userId]);

    return null;
}
