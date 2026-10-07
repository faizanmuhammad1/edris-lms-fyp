import { unsubscribeByToken } from "@/app/actions/newsletter";
import { redirect } from "next/navigation";
import { UnsubscribeForm } from "./_components/UnsubscribeForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { searchParams: Promise<{ token?: string | string[]; email?: string | string[] }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const email = typeof params.email === "string" ? params.email : undefined;

  // Legacy newsletter links: /unsubscribe?token=<subscriber token>
  if (token && !email) {
    const result = await unsubscribeByToken(token);
    if (result.ok) {
      redirect("/?unsubscribed=1");
    }
    redirect("/?unsubscribe=error");
  }

  // Campaign links: /unsubscribe?email=...&token=<signed token>. Ask for an
  // explicit click so link scanners that prefetch URLs don't unsubscribe people.
  const hasSignedLink = Boolean(email && token);

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            {hasSignedLink
              ? "Confirm that you want to stop receiving marketing emails from Edris."
              : "To unsubscribe, use the “Unsubscribe” link at the bottom of any marketing email you received from Edris."}
          </CardDescription>
        </CardHeader>
        {email && token && (
          <CardContent>
            <UnsubscribeForm email={email} token={token} />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
