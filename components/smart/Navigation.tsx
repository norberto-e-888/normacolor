"use client";

import { Hexagon, LogOut, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { SessionUser } from "@/auth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { routes } from "@/constants/routes";
import { signOut } from "@/functions/auth";
import { useCart } from "@/hooks/use-cart";

import { CartCount } from "./cart-count";
import { NotificationDropdown } from "./notification-dropdown";

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
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const { totalItems, clearCart } = useCart();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Don't render navigation for admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const handleSignOut = async (shouldClearCart: boolean) => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      if (shouldClearCart) {
        clearCart();
      }

      await signOut();
    } catch (error) {
      console.error("Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  const handleSignOutClick = () => {
    if (totalItems() > 0) {
      setShowModal(true);
    } else {
      handleSignOut(false);
    }
  };

  const visibleRoutes = routes.filter((route) => {
    // If route is public, always show it
    if (route.isPublic) return true;

    // If route requires specific roles, check session
    if (route.roles) {
      return (
        session?.user &&
        route.roles.includes((session.user as SessionUser).role)
      );
    }

    // By default, require authentication
    return !!session;
  });

  return (
    <>
      <nav className="flex gap-8 items-center p-4 bg-primary text-primary-foreground shrink-0">
        <Link href="/login" className="flex gap-1 items-center">
          <Hexagon size="24px" />
          <span className="text-lg font-bold">Normacolor</span>
        </Link>

        <div className="flex gap-8 items-center">
          {visibleRoutes.map((route) =>
            route.path === "/checkout" ? null : (
              <NavLink key={route.path} href={route.path}>
                {route.label}
              </NavLink>
            )
          )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {status === "authenticated" && <NotificationDropdown />}
          <NavLink href="/checkout">
            <div className="relative">
              <ShoppingCart size="24px" />
              <CartCount />
            </div>
          </NavLink>
          {status === "authenticated" && (
            <Button
              variant="secondary"
              onClick={handleSignOutClick}
              disabled={isLoggingOut}
            >
              <LogOut size="24px" />
            </Button>
          )}
        </div>
      </nav>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-4">
            ¿Deseas mantener tu carrito?
          </h2>
          <p className="text-muted-foreground mb-6">
            Si limpias el carrito, perderás los productos seleccionados. Si lo
            mantienes, permanecerá disponible en una sesión anónima.
          </p>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                handleSignOut(false);
              }}
              disabled={isLoggingOut}
            >
              Mantener carrito
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowModal(false);
                handleSignOut(true);
              }}
              disabled={isLoggingOut}
            >
              Limpiar carrito
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
