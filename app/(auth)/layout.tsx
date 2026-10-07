import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import Link from "next/link";
import { ReactNode } from "react";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "absolute top-4 left-4",
        })}
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="flex w-full max-w-md flex-col gap-6 px-4">
        <Link
          className="flex flex-col items-center gap-2 self-center"
          href="/"
        >
          <Image src={Logo} alt="Logo" width={80} height={80} />
          <span className="text-2xl font-semibold">Edris LMS</span>
        </Link>
        {children}

        <div className="text-balance text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <span className="hover:text-primary hover:underline">
            Terms of service
          </span>{" "}
          and{" "}
          <span className="hover:text-primary hover:underline">
            Privacy Policy
          </span>
          .
        </div>
      </div>
    </div>
  );
}
