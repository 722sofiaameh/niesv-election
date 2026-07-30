import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";

import { VoterProviders } from "@/components/voter/voter-providers";
import { cn } from "@/lib/utils";

import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "NIESV Abuja Branch Election",
  description: "Official online voting platform for the NIESV Abuja Branch election",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={cn(
          sourceSans.variable,
          sourceSans.className,
          "voter-theme min-h-screen antialiased",
        )}
      >
        <VoterProviders>{children}</VoterProviders>
      </body>
    </html>
  );
}
