import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { Providers } from "@/components/providers";
import { Navigation } from "@/components/smart/navigation";

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
          <main className="flex-1 overflow-y-auto">{children}</main>
          <footer className="p-1.5 bg-muted text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Normacolor Panama S.A. Todos los
              derechos reservados.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
