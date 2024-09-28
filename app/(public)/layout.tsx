import Link from "next/link";

import { UserRole } from "@/database";
import { getServerSession } from "@/functions/auth";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link
              href={
                session
                  ? session.user.role === UserRole.Admin
                    ? "/admin"
                    : "/"
                  : "/ingreso"
              }
            >
              {session ? "App" : "Ingresa"}
            </Link>
          </li>
          <li>
            <Link href="/productos">Productos</Link>
          </li>
          <li>
            <Link href="/promociones">Promociones</Link>
          </li>
        </ul>
      </nav>

      {children}
    </div>
  );
}
