import { redirect } from "next/navigation";

export default async function LegacyCertificateRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/dashboard/certificate/${slug}`);
}
