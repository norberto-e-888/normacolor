import { Hexagon, ShoppingCart } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { Container } from "@/components/ui";

const CartCount = dynamic(
  () => import("@/components/smart/CartCount").then((mod) => mod.CartCount),
  { ssr: false }
);

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Container>
      <nav className="sticky top-0 z-50 flex gap-4 items-center p-4 bg-primary text-primary-foreground">
        <Link href="/login" className="flex gap-1 items-center">
          <Hexagon size="24px" />
          <span className="text-lg font-bold">Normacolor</span>
        </Link>

        <Link href="/productos">
          <span className="text-lg">Productos</span>
        </Link>

        <Link href="/promociones">
          <span className="text-lg">Promociones</span>
        </Link>

        <div className="ml-auto">
          <Link href="/checkout" className="relative">
            <ShoppingCart size="24px" />
            <CartCount />
          </Link>
        </div>
      </nav>

      <main className="flex-1 overflow-auto">{children}</main>

      <footer className="p-1.5 bg-muted text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Normacolor Panama S.A. Todos los derechos
          reservados.
        </p>
      </footer>
    </Container>
  );
}
