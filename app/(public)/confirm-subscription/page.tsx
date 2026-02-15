import { confirmSubscription } from "@/app/actions/newsletter";
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ConfirmSubscriptionPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) {
    redirect("/?confirm=invalid");
  }

  const result = await confirmSubscription(token);
  if (result.ok) {
    redirect("/?subscribed=1");
  }
  redirect("/?confirm=error");
}
