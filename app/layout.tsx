import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import { ToastProvider } from "@/hooks/useToast";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ToastProvider>
      </body>
    </html>
  );
}
