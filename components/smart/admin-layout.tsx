"use client";

import {
  ChevronUp,
  Ellipsis,
  FileUp,
  LayoutGrid,
  LogOut,
  Logs,
  MessageCircleQuestion,
  MessageSquare,
  Moon,
  Package,
  ShoppingBag,
  Sun,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { SessionUser } from "@/auth";
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollArea,
} from "@/components/ui";
import { UserRole } from "@/database";
import { signOut } from "@/functions/auth";

type Icon = typeof Package; // hack
type NavItem = {
  href: string;
  label: string;
  icon: Icon;
};

const navItemsPerRole: { [key in UserRole]: NavItem[] } = {
  [UserRole.Admin]: [
    { href: "/admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/productos", label: "Productos", icon: Package },
    { href: "/admin/ordenes", label: "Ordenes", icon: ShoppingBag },
    { href: "/admin/artes", label: "Artes", icon: FileUp },
    { href: "/admin/promociones", label: "Promociones", icon: Tag },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/mensajes", label: "Mensajes", icon: MessageSquare },
  ],
  [UserRole.Client]: [
    { href: "/", label: "Dashboard", icon: LayoutGrid },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/ordenes", label: "Ordenes", icon: ShoppingBag },
    { href: "/artes", label: "Artes", icon: FileUp },
    { href: "/promociones", label: "Promociones", icon: Tag },
    { href: "/ayuda", label: "Ayuda", icon: MessageCircleQuestion },
  ],
};

export type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
  user: SessionUser;
}>;

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const isMediumScreen = useMediaQuery("(min-width: 768px)");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const navItems = navItemsPerRole[user.role];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isMediumScreen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMediumScreen]);

  const MenuHeader = () => (
    <header className="md:hidden flex items-center justify-between px-4 py-2 h-14 w-full bg-zinc-200 dark:bg-zinc-950 border-zinc-950 dark:border-zinc-200">
      <Button
        className="block md:hidden items-center p-0"
        variant="ghost"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <ChevronUp size="24px" /> : <Logs size="24px" />}
      </Button>
    </header>
  );

  return (
    <div className="flex h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-5 border-r bg-zinc-200 dark:bg-zinc-950 border-zinc-950 dark:border-zinc-200 ${
          isMobileMenuOpen ? "translate-x-0 w-full " : "-translate-x-full"
        } md:relative md:translate-x-0 md:min-w-96`}
      >
        <div className="flex flex-col justify-between h-full">
          <ScrollArea className="flex-grow">
            <MenuHeader />
            <nav className="p-4 space-y-2">
              {navItems?.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-sm text-lg ${
                      pathname === item.href
                        ? "text-zinc-100 bg-indigo-800"
                        : "text-zinc-800 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-950 hover:bg-zinc-950 dark:hover:bg-zinc-300 hover:text-zinc-100 dark:hover:text-zinc-800"
                    }`}
                  >
                    <Icon size="24px" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="bg-zinc-200 dark:bg-zinc-950 border-t border-zinc-950 dark:border-zinc-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="p-6">
                <Button className="flex items-center justify-between w-full rounded-none bg-zinc-200 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-950">
                  <span className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="text-zinc-100 bg-indigo-800">
                        {(user?.name || user?.email)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-base text-zinc-800 dark:text-zinc-300">
                        {user?.name || user?.email}
                      </span>
                    </div>
                  </span>
                  <Ellipsis className="text-zinc-800 dark:text-zinc-100" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 m-0 -mb-1 bg-zinc-200 dark:bg-zinc-950 border-2 border-zinc-950 dark:border-zinc-200 rounded-none"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDarkMode();
                  }}
                  className="hover:bg-zinc-950 dark:hover:bg-zinc-300 text-zinc-800 dark:text-zinc-300 hover:text-zinc-300 dark:hover:text-zinc-800 hover:cursor-pointer"
                >
                  {isDarkMode ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span className="text-base">
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    await signOut();
                  }}
                  className="hover:bg-zinc-950 dark:hover:bg-zinc-300 text-zinc-800 dark:text-zinc-300 hover:text-zinc-300 dark:hover:text-zinc-800 hover:cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hover:text-zinc-300 dark:hover:text-zinc-800 text-base">
                    Log out
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <MenuHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-200 dark:bg-zinc-950">
          <div className="mx-auto min-h-screen px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
