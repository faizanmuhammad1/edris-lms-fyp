"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png";
import { ThemeToggle } from "@/components/ui/themeToggle";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "./UserDropdown";
import { Search, ShoppingCart, Menu, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigationItems = [
  { name: "Teach on Edris", href: "/teach" },
  { name: "My Learning", href: "/dashboard" },
];

const categories = [
  "Development",
  "Business",
  "Finance & Accounting",
  "IT & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
];

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container flex h-16 items-center mx-auto px-4 md:px-6 lg:px-8 gap-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <button className="p-2 hover:bg-accent rounded-full transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <p className="text-sm font-semibold text-muted-foreground mb-2">Categories</p>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat}
                  href={`/courses?category=${cat}`}
                  className="text-base text-muted-foreground hover:text-primary transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-4 shrink-0 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image src={Logo} alt="Logo" className="size-9 relative z-10" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Edris LMS</span>
        </Link>

        {/* Categories Dropdown */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors focus:outline-none">
              Categories <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-2">
              {categories.map((cat) => (
                <DropdownMenuItem key={cat} asChild>
                  <Link href={`/courses?category=${cat}`} className="cursor-pointer w-full">
                    {cat}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <div className={`hidden md:flex flex-1 max-w-xl mx-4 relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for anything..."
              className="w-full pl-10 h-10 rounded-full border-muted-foreground/20 bg-muted/50 focus-visible:bg-background focus-visible:ring-primary/20 transition-all"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 ml-auto shrink-0">
          <Link href="/teach" className="hidden lg:block text-sm font-medium hover:text-primary transition-colors mr-2">
            Teach on Edris
          </Link>
          
          <Link href="/cart" className="p-2 hover:bg-accent rounded-full transition-colors relative group">
            <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="absolute top-1 right-0.5 h-2 w-2 bg-primary rounded-full ring-2 ring-background" />
          </Link>

          <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
          
          <ThemeToggle />

          {isPending ? (
             <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <UserDropdown
              email={session.user.email}
              image={
                session?.user.image ??
                `https://avatar.vercel.sh/${session?.user.email}`
              }
              name={
                session?.user.name && session.user.name.length > 0
                  ? session.user.name
                  : session?.user.email.split("@")[0]
              }
            />
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:flex" })}
              >
                Log in
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm", className: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" })}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
