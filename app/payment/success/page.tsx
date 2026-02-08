import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PaymentSuccessContent } from "./payment-success-content";
import { ReconcilePayment } from "./reconcile-payment";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { session_id } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <>
      {session_id && (
        <ReconcilePayment
          sessionId={session_id}
          userId={session?.user.id ?? null}
        />
      )}
      <PaymentSuccessContent reconciled={!!session_id} />
    </>
  );
}
