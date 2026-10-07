import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "../ui/themeToggle";
import { AppBreadcrumbs } from "./app-breadcrumbs";

/**
 * Sticky top bar for the admin / teacher / student shells. The sidebar trigger
 * opens the off-canvas navigation on phones and collapses it on desktop.
 */
export function SiteHeader() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:rounded-t-xl">
        <div className="flex w-full min-w-0 items-center gap-1 px-3 sm:px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 size-10 md:size-8" aria-label="Toggle navigation menu" />
          <Separator orientation="vertical" className="mx-1.5 data-[orientation=vertical]:h-4 sm:mx-2" />
          {/* Brand label only (each page renders its own h1); the sidebar shows it on desktop. */}
          <span className="truncate text-base font-medium md:hidden">Edris LMS</span>
          <AppBreadcrumbs className="hidden md:block" />
          <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
      {/* Target of the "Skip to main content" link: page content starts right after the header. */}
      <div id="main-content" tabIndex={-1} className="scroll-mt-(--header-height) outline-none" />
    </>
  );
}
