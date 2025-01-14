"use client";

import { Hexagon, LogOut, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui";
import { signOut } from "@/functions/auth";

import { CartCount } from "./cart-count";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href === "/checkout" && pathname.startsWith("/pagar"));

  return (
    <Link
      href={href}
      className={`relative text-lg transition-colors ${
        isActive
          ? "text-primary-foreground"
          : "text-primary-foreground/70 hover:text-primary-foreground"
      }`}
    >
      {children}
      {isActive && (
        <span
          className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary-foreground rounded-full"
          style={{
            animation: "scaleX 0.2s ease-in-out",
            transformOrigin: "center",
          }}
        />
      )}
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();

  // Don't render navigation for admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="flex gap-8 items-center p-4 bg-primary text-primary-foreground shrink-0">
      <Link href="/login" className="flex gap-1 items-center">
        <Hexagon size="24px" />
        <span className="text-lg font-bold">Normacolor</span>
      </Link>

      <div className="flex gap-8 items-center">
        <NavLink href="/productos">Productos</NavLink>
        <NavLink href="/ordenes">Ordenes</NavLink>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <NavLink href="/checkout">
          <div className="relative">
            <ShoppingCart size="24px" />
            <CartCount />
          </div>
        </NavLink>
        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut size="24px" />
        </Button>
      </div>
    </nav>
  );
}
