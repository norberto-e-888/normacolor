import { redirect } from "next/navigation";

import { getServerSession, signOut } from "@/functions/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <nav>
        <ul className="flex flex-row">
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
