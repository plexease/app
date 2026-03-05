import type { Metadata } from "next";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/ui/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plexease",
  description: "Complex integrations, made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
