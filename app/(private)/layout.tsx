import { auth } from "@/auth";
import { signOut } from "@/actions";
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
                await signOut({ redirectTo: "/ingreso" });
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
