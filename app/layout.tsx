import "./globals.css";

import { Hexagon, ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import Link from "next/link";
import { Toaster } from "sonner";

import { ToastProvider } from "@/hooks/useToast";

const CartCount = dynamic(
  () => import("@/components/smart/CartCount").then((mod) => mod.CartCount),
  { ssr: false }
);

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
        <ToastProvider>
          <nav className="flex gap-4 items-center p-4 bg-primary text-primary-foreground shrink-0">
            <Link href="/login" className="flex gap-1 items-center">
              <Hexagon size="24px" />
              <span className="text-lg font-bold">Normacolor</span>
            </Link>

            <Link href="/productos">
              <span className="text-lg">Productos</span>
            </Link>

            <Link href="/ordenes">
              <span className="text-lg">Ordenes</span>
            </Link>

            <div className="ml-auto">
              <Link href="/checkout" className="relative">
                <ShoppingCart size="24px" />
                <CartCount />
              </Link>
            </div>
          </nav>

          <main className="flex-1 overflow-y-auto">{children}</main>
          <footer className="p-1.5 bg-muted text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Normacolor Panama S.A. Todos los
              derechos reservados.
            </p>
          </footer>
          <Toaster richColors position="top-center" />
        </ToastProvider>
      </body>
    </html>
  );
}
