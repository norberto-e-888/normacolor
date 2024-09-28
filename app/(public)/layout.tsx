import { Page } from "@/components/ui";
import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <header>
        <nav className="p-2">
          <ul className="flex gap-2">
            <li>
              <Link href="/login">Login</Link>
            </li>
            <li>
              <Link href="/productos">Productos</Link>
            </li>
            <li>
              <Link href="/promociones">Promociones</Link>
            </li>
          </ul>
        </nav>
      </header>

      {children}
    </div>
  );
}
