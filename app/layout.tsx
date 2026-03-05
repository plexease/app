import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
