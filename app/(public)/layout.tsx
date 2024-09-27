import Link from "next/link";

import { getServerSession } from "@/functions/auth";
import { USER_ROLE_TO_ROOT_MAP } from "@/utils";

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
                session ? USER_ROLE_TO_ROOT_MAP[session.user.role] : "/ingreso"
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
