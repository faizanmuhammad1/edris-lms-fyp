import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Edris LMS - Online Learning Platform",
    template: "%s | Edris LMS",
  },
  description: "Edris LMS is a comprehensive online learning management system. Explore courses, learn new skills, and achieve your educational goals.",
  keywords: ["LMS", "online learning", "courses", "education", "e-learning", "Edris"],
  authors: [{ name: "Edris LMS Team" }],
  openGraph: {
    title: "Edris LMS - Online Learning Platform",
    description: "Explore courses, learn new skills, and achieve your educational goals.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
          <Toaster closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
