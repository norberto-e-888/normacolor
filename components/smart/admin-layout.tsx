"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:block md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {(user?.name || user?.email)?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.name || user?.email}
                      </span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={toggleDarkMode}>
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
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="flex-grow">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm ${
                      pathname === item.href
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden p-4">
          <Button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            Menu
          </Button>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="mx-auto min-h-screen px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
