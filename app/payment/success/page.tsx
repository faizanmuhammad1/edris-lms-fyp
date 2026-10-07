import { PaymentSuccessContent } from "./payment-success-content";
import { reconcileCheckout } from "./actions";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

// Reconciliation may poll Stripe for a few seconds.
export const maxDuration = 30;

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { session_id } = await searchParams;
  const reconciled = session_id ? await reconcileCheckout(session_id) : false;

  return <PaymentSuccessContent reconciled={reconciled} />;
}
