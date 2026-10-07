import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { MotionProvider } from "@/components/ui/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.edrislms.com").replace(/\/$/, "");
const siteDescription =
  "Edris LMS is an online learning platform with expert-led video courses, quizzes, assignments, an AI tutor, and blockchain-verified certificates.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Edris LMS - Online Learning Platform",
    template: "%s | Edris LMS",
  },
  description: siteDescription,
  applicationName: "Edris LMS",
  keywords: ["LMS", "online learning", "courses", "education", "e-learning", "Edris"],
  authors: [{ name: "Edris LMS Team" }],
  openGraph: {
    title: "Edris LMS - Online Learning Platform",
    description: siteDescription,
    type: "website",
    siteName: "Edris LMS",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edris LMS - Online Learning Platform",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1311" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            {children}
            <Toaster closeButton richColors position="bottom-center" />
          </MotionProvider>
        </ThemeProvider>
        {/* Cookieless real-user analytics and Core Web Vitals; the scripts only exist on Vercel. */}
        {process.env.VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
