import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/common/providers";
import { cn } from "@/lib/utils";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexa — AI Automation Workspace",
  description:
    "An AI operating system for the rest of us. Tell Nexa what you want done, and watch it happen.",
  metadataBase: new URL("https://nexa.app"),
  openGraph: {
    title: "Nexa",
    description: "An AI operating system for the rest of us.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        instrumentSerif.variable,
      )}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
