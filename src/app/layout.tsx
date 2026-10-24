import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Andika, Geist, Geist_Mono, Mali } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Storybook type for the illustrated adventures: hand lettering for names, an easy-reading face for riddles.
const mali = Mali({
  variable: "--font-mali",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const andika = Andika({
  variable: "--font-andika",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Met: Hidden Treasures",
  description: "10 galleries. 10 mysteries. A scavenger hunt in The Met’s European Paintings galleries.",
  appleWebApp: { capable: true, title: "Hidden Treasures", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${mali.variable} ${andika.variable} antialiased`}>
      <body className="min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
