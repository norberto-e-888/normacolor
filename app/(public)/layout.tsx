import { Hexagon } from "lucide-react";
import Link from "next/link";

import { Container, Page } from "@/components/ui";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Container>
      <nav className="flex gap-4 items-center p-4 bg-primary text-primary-foreground">
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
      </nav>

      <Page>{children}</Page>

      <footer className="p-1.5 bg-muted text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Normacolor Panama S.A. Todos los derechos
          reservados.
        </p>
      </footer>
    </Container>
  );
}
