import { redirect } from "next/navigation";

import { getServerSession, signOut } from "@/functions/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/ingreso");
  }

  return (
    <div>
      <nav>
        <ul>
          <li>
            <form action={signOut}>
              <button type="submit" className="border-2 p-2">
                Salir
              </button>
            </form>
          </li>
        </ul>
      </nav>

      {children}
    </div>
  );
}
