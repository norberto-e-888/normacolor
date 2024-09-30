"use client";

import {
  ChevronUp,
  Ellipsis,
  FileText,
  LayoutDashboard,
  LogOut,
  Logs,
  MessageSquare,
  Moon,
  Package,
  ShoppingCart,
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
import { signOut } from "@/functions/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/orders", label: "Ordenes", icon: ShoppingCart },
  { href: "/invoices", label: "Facturas", icon: FileText },
  { href: "/promotions", label: "Promociones", icon: Tag },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/messages", label: "Mensajes", icon: MessageSquare },
];

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
    <header className="md:hidden flex items-center justify-between px-4 py-2 h-14 w-full bg-indigo-200 dark:bg-indigo-950 border-indigo-950 dark:border-indigo-200">
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
        className={`fixed inset-y-0 left-0 z-5 border-r bg-indigo-200 dark:bg-indigo-950 border-indigo-950 dark:border-indigo-200 ${
          isMobileMenuOpen ? "translate-x-0 w-full " : "-translate-x-full"
        } md:relative md:translate-x-0 md:min-w-96`}
      >
        <div className="flex flex-col justify-between h-full">
          <ScrollArea className="flex-grow">
            <MenuHeader />
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm ${
                      pathname === item.href
                        ? "text-gray-100 dark:text-gray-950 bg-indigo-950 dark:bg-indigo-200"
                        : "text-gray-800 dark:text-gray-300 bg-indigo-200 dark:bg-indigo-950 hover:bg-indigo-800 dark:hover:bg-indigo-300 hover:text-gray-200 dark:hover:text-gray-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="bg-indigo-200 dark:bg-indigo-950 border-t border-indigo-950 dark:border-indigo-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="p-6">
                <Button className="flex items-center justify-between w-full rounded-none bg-indigo-200 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-950">
                  <span className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-indigo-950 text-gray-300 dark:bg-indigo-200 dark:text-gray-800">
                        {(user?.name || user?.email)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-md text-gray-800 dark:text-gray-300">
                        {user?.name || user?.email}
                      </span>
                    </div>
                  </span>
                  <Ellipsis className="text-gray-800 dark:text-gray-200" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 bg-indigo-200 dark:bg-indigo-950"
              >
                <DropdownMenuItem
                  onClick={toggleDarkMode}
                  className="hover:bg-indigo-800 dark:hover:bg-indigo-300 text-gray-800 dark:text-gray-300 hover:text-gray-300 dark:hover:text-gray-800 hover:cursor-pointer"
                >
                  {isDarkMode ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.preventDefault();
                    await signOut();
                  }}
                  className="hover:bg-indigo-800 dark:hover:bg-indigo-300 text-gray-800 dark:text-gray-300 hover:text-gray-300 dark:hover:text-gray-800 hover:cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hover:text-gray-300 dark:hover:text-gray-800">
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-indigo-200 dark:bg-indigo-950">
          <div className="mx-auto min-h-screen px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
