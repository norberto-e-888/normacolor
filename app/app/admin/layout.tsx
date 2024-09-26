import { auth } from "@/auth";
import { UserRole } from "@/models";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session || session.user.role !== UserRole.Admin) {
    redirect(session ? `/app/${session.user.role}` : "/ingreso");
  }

  return children;
}
