"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Laptop,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
} from "lucide-react";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import WhiteLogo from "@/public/edriswhitelogo.png";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useSignOut } from "@/hooks/use-singout";
import { cn } from "@/lib/utils";
import {
  verificationPortalLinkProps,
  verificationPortalUrl,
} from "@/lib/verification-portal-url";
import { UserDropdown } from "./UserDropdown";

const verificationHref = verificationPortalUrl();

const categories = [
  "Development",
  "Business",
  "Finance",
  "IT & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
];

const categoryHref = (category: string) => `/courses?category=${encodeURIComponent(category)}`;

/** Course search; works as a plain GET form before hydration. */
function SearchForm({
  id,
  className,
  inputClassName,
  onSearch,
}: {
  id: string;
  className?: string;
  inputClassName?: string;
  onSearch?: () => void;
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("search") ?? "").trim();
    onSearch?.();
    router.push(value ? `/courses?search=${encodeURIComponent(value)}` : "/courses");
  }

  return (
    <form role="search" action="/courses" onSubmit={handleSubmit} className={cn("relative w-full min-w-0", className)}>
      <label htmlFor={id} className="sr-only">
        Search courses
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        name="search"
        type="search"
        placeholder="Search courses"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={100}
        className={cn(
          "h-10 rounded-full border-transparent bg-muted/70 pl-9 shadow-none transition-colors focus-visible:border-ring focus-visible:bg-background",
          inputClassName
        )}
      />
    </form>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ] as const;

  return (
    <div role="group" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors",
              active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
            )}
          >
            <option.icon className="size-4" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Desktop navigation link with an active-page indicator. */
function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        "after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primary after:transition-opacity",
        active ? "after:opacity-100" : "after:opacity-0"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
  active,
  external,
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
  active?: boolean;
  external?: boolean;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          active && "bg-accent text-accent-foreground"
        )}
        {...(external ? verificationPortalLinkProps(href) : {})}
      >
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        {label}
      </Link>
    </SheetClose>
  );
}

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const handleSignOut = useSignOut();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const coursesActive = pathname === "/courses" || pathname.startsWith("/courses/");
  const teachActive = pathname === "/teach";
  const user = session?.user;
  const displayName = user ? (user.name?.trim() ? user.name : user.email.split("@")[0]) : "";
  const avatarSrc =
    user?.image ?? (user ? `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(user.email)}` : "");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-shadow supports-[backdrop-filter]:bg-background/70",
        scrolled ? "border-border shadow-[0_1px_12px_-4px_rgb(0_0_0/0.12)]" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:gap-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md"
          aria-label="Edris LMS home"
        >
          <Image src={Logo} alt="" className="h-9 w-auto dark:hidden" priority sizes="36px" />
          <Image src={WhiteLogo} alt="" className="hidden h-9 w-auto dark:block" sizes="36px" />
          <span className="hidden text-[17px] font-semibold tracking-tight min-[380px]:inline">Edris LMS</span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden items-center lg:flex">
          <NavLink href="/courses" active={coursesActive}>
            Courses
          </NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground"
              >
                Categories
                <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={10} className="w-[min(30rem,calc(100vw-2rem))] p-2">
              <DropdownMenuLabel className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Browse by category
              </DropdownMenuLabel>
              <div className="grid grid-cols-2 gap-0.5">
                {categories.map((category) => (
                  <DropdownMenuItem key={category} asChild className="min-h-9 cursor-pointer rounded-md px-2">
                    <Link href={categoryHref(category)}>{category}</Link>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="min-h-9 cursor-pointer rounded-md px-2 font-medium text-primary">
                <Link href="/courses">View all courses</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NavLink href="/teach" active={teachActive}>
            <span className="xl:hidden">Teach</span>
            <span className="hidden xl:inline">Teach on Edris</span>
          </NavLink>
        </nav>

        {/* Search: inline from sm; inside the menu on phones */}
        <SearchForm
          id="navbar-search"
          className="hidden flex-1 sm:block lg:max-w-xs xl:max-w-sm"
        />
        <div className="flex-1 sm:hidden" aria-hidden="true" />

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Link
            href={verificationHref}
            aria-label="Verify a certificate (opens in a new tab)"
            title="Verify a certificate"
            className={buttonVariants({
              variant: "ghost",
              className: "hidden h-10 gap-2 px-2.5 text-muted-foreground hover:text-foreground lg:inline-flex",
            })}
            {...verificationPortalLinkProps(verificationHref)}
          >
            <ShieldCheck className="size-5" aria-hidden="true" />
            <span className="hidden 2xl:inline">Verify</span>
          </Link>

          {/* While the session loads, assume signed in so the cart fetches instead of flashing a sign-in prompt. */}
          <CartDrawer isSignedIn={isPending || Boolean(session)} />

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>

          {isPending ? (
            <div className="h-9 w-[76px] animate-pulse rounded-md bg-muted lg:w-[188px]" aria-hidden="true" />
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "outline", className: "hidden h-10 lg:inline-flex" })}
              >
                My learning
              </Link>
              <div className="hidden lg:block">
                <UserDropdown email={user.email} image={avatarSrc} name={displayName} />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", className: "hidden h-10 lg:inline-flex" })}
              >
                Log in
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ className: "h-10 px-3.5 sm:px-4" })}
              >
                <span className="lg:hidden">Sign in</span>
                <span className="hidden lg:inline">Get started</span>
              </Link>
            </>
          )}

          {/* Menu (below lg) */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-10 lg:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2.5 text-base">
                  <Image src={Logo} alt="" className="h-8 w-auto dark:hidden" sizes="32px" />
                  <Image src={WhiteLogo} alt="" className="hidden h-8 w-auto dark:block" sizes="32px" />
                  Edris LMS
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Search courses, browse categories and manage your account.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
                {user && (
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                    <Avatar className="size-10">
                      <AvatarImage src={avatarSrc} alt="" />
                      <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                )}

                <SearchForm id="mobile-search" onSearch={closeMenu} inputClassName="h-11" />

                <nav aria-label="Mobile" className="-mx-1 space-y-0.5">
                  {user && (
                    <MobileNavItem
                      href="/dashboard"
                      icon={LayoutDashboard}
                      label="My learning"
                      active={pathname.startsWith("/dashboard")}
                    />
                  )}
                  <MobileNavItem href="/courses" icon={BookOpen} label="Browse courses" active={coursesActive} />
                  <MobileNavItem href="/teach" icon={GraduationCap} label="Teach on Edris" active={teachActive} />
                  <MobileNavItem href={verificationHref} icon={ShieldCheck} label="Verify a certificate" external />
                </nav>

                <section aria-labelledby="mobile-categories">
                  <h2 id="mobile-categories" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Categories
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <li key={category}>
                        <SheetClose asChild>
                          <Link
                            href={categoryHref(category)}
                            className="inline-flex min-h-10 items-center rounded-full border bg-background px-3.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                          >
                            {category}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="mobile-appearance">
                  <h2 id="mobile-appearance" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Appearance
                  </h2>
                  <ThemeSwitcher />
                </section>
              </div>

              <div className="border-t p-4">
                {isPending ? null : user ? (
                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => {
                      closeMenu();
                      handleSignOut();
                    }}
                  >
                    <LogOut aria-hidden="true" />
                    Sign out
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Link href="/login" className={buttonVariants({ variant: "outline", className: "h-11" })}>
                        Log in
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/login" className={buttonVariants({ className: "h-11" })}>
                        Get started
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
