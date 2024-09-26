import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect("/ingreso");
  }

  return (
    <div>
      <nav>
        <ul>
          <li>
            <form
              action={async () => {
                "use server";
                await signOut({
                  redirectTo: "/ingreso",
                });
              }}
            >
              <button type="submit" className="border border-indigo-600 p-2">
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
