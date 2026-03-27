import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CertificateTemplate } from "@/app/dashboard/certificate/[slug]/CertificateTemplate";
import { getServerBaseUrl } from "@/lib/base-url";

import { Great_Vibes, Cinzel, EB_Garamond, Montserrat } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

function formatCertId(uniqueId: string, issuedAt: string) {
  const year = new Date(issuedAt).getFullYear();
  const short = uniqueId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `EDR-${year}-${short}`;
}

function networkDisplayName(network: string | null | undefined): string {
  if (!network) return "Polygon Amoy Network";
  const n = network.toLowerCase();
  if (n.includes("amoy") || n.includes("polygon")) {
    return "Polygon Amoy Network";
  }
  return network;
}

export default async function RenderCertificatePage({
  params,
}: {
  params: Promise<{ uniqueId: string }>;
}) {
  const { uniqueId } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { uniqueId },
    select: {
      uniqueId: true,
      issuedAt: true,
      recipientName: true,
      blockchainStatus: true,
      txHash: true,
      blockNumber: true,
      network: true,
      contractAddress: true,
      qrData: true,
      Course: {
        select: {
          title: true,
          duration: true,
          user: { select: { name: true } },
        },
      },
      User: {
        select: { name: true },
      },
    },
  });

  if (!certificate) return notFound();

  const baseUrl = getServerBaseUrl();

  const issuedDate = new Date(certificate.issuedAt);
  const day = issuedDate.getDate().toString().padStart(2, "0");
  const month = (issuedDate.getMonth() + 1).toString().padStart(2, "0");
  const year = issuedDate.getFullYear();

  const blockchainStatus = certificate.blockchainStatus ?? "PENDING";
  const verificationUrl = `${baseUrl}/verification?cid=${certificate.uniqueId}`;
  const certDisplayId = formatCertId(
    certificate.uniqueId,
    certificate.issuedAt.toISOString()
  );

  const explorerBase =
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? "https://amoy.polygonscan.com";

  const txUrl = certificate.txHash
    ? `${explorerBase}/tx/${certificate.txHash}`
    : null;

  return (
    <div
      className={`min-h-dvh w-full bg-background p-4 md:p-8 ${cinzel.variable} ${greatVibes.variable} ${garamond.variable} ${montserrat.variable}`}
    >
      <CertificateTemplate
        userName={certificate.recipientName || certificate.User.name || "Learner"}
        courseTitle={certificate.Course.title}
        courseHours={certificate.Course.duration}
        instructorName={certificate.Course.user.name}
        verificationUrl={verificationUrl}
        qrData={certificate.qrData}
        certDisplayId={certDisplayId}
        uniqueId={certificate.uniqueId}
        issuedAt={issuedDate}
        contractAddress={certificate.contractAddress}
        day={day}
        month={month}
        year={year}
        networkLabel={networkDisplayName(certificate.network)}
        blockchainStatus={blockchainStatus}
        txUrl={txUrl}
        txHash={certificate.txHash}
      />
    </div>
  );
}

