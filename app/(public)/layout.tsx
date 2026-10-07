import { ReactNode, Suspense } from "react";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { SubscriptionParamsToasts } from "./_components/SubscriptionParamsToasts";

// Signed-in teachers and admins may browse the public site (e.g. to preview their course
// page); only the home page sends signed-in users to their own dashboard.
export default function LayoutPublic({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-[3px] focus:ring-ring/50"
      >
        Skip to main content
      </a>
      <Suspense fallback={null}>
        <SubscriptionParamsToasts />
      </Suspense>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
