import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import Link from "next/link";
import { ReactNode } from "react";
import type { Metadata } from "next";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/"
          className={buttonVariants({
            variant: "ghost",
            className: "h-10",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-12">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link
            className="flex flex-col items-center gap-2 self-center rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href="/"
            aria-label="Edris LMS home"
          >
            <Image src={Logo} alt="" width={64} height={64} priority />
            <span className="text-xl font-semibold">Edris LMS</span>
          </Link>
          {children}

          <p className="text-balance text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
