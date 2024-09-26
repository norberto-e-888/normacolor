import { auth } from "@/auth";
import { UserRole } from "@/models";
import { redirect } from "next/navigation";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session || session.user.role !== UserRole.Client) {
    redirect(session ? `/app/${session.user.role}` : "/ingreso");
  }

  return children;
}
