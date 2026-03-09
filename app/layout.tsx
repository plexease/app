import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/ui/cookie-consent";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: { default: "Plexease", template: "%s | Plexease" },
  description:
    "AI-powered integration tools for .NET developers, tech support staff, and small businesses.",
  keywords: [
    "NuGet",
    ".NET",
    "integration tools",
    "AI",
    "package advisor",
    "code generation",
  ],
  // TODO: Replace with https://plexease.io when domain is purchased
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Plexease",
    description: "Complex integrations, with ease",
    siteName: "Plexease",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plexease",
    description: "Complex integrations, with ease",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${inter.variable} font-sans bg-surface-950`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <CookieConsent />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#131121",
              border: "1px solid #2e2946",
              color: "#b8b4cc",
            },
            actionButtonStyle: {
              background: "#8b5cf6",
              color: "#ffffff",
            },
          }}
        />
      </body>
    </html>
  );
}
