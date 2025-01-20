"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="p-2 bg-muted text-center">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Normacolor Panama S.A. Todos los derechos
        reservados.
      </p>
    </footer>
  );
}
