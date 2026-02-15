import { unsubscribeByToken } from "@/app/actions/newsletter";
import { redirect } from "next/navigation";
import { UnsubscribeForm } from "./_components/UnsubscribeForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (token) {
    const result = await unsubscribeByToken(token);
    if (result.ok) {
      redirect("/?unsubscribed=1");
    }
    redirect("/?unsubscribe=error");
  }

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
          <CardDescription>
            Enter your email to stop receiving marketing emails from Edris.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnsubscribeForm />
        </CardContent>
      </Card>
    </div>
  );
}
