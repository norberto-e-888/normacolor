import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { Providers } from "@/components/providers";
import { Footer } from "@/components/smart/footer";
import { Navigation } from "@/components/smart/navigation";
import { PromotionNotifications } from "@/components/smart/promotion-notification";

import { Effects } from "./effects";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Normacolor Panamá",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}
      >
        <Providers>
          <Navigation />
          <main className="overflow-y-auto h-full">{children}</main>
          <Footer />
          <PromotionNotifications />
          <Effects />
        </Providers>
      </body>
    </html>
  );
}
