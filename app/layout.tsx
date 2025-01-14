import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { Footer } from "@/components/smart/footer";
import { Navigation } from "@/components/smart/navigation";
import { ToastProvider } from "@/hooks/use-toast";

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
        <SessionProvider>
          <ToastProvider>
            <Navigation />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <Footer />
            <Toaster richColors position="top-center" />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
