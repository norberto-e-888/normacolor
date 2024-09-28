import { redirect } from "next/navigation";

import { getServerSession } from "@/functions/auth";
import { UserRole } from "@/database";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (session && session.user.role !== UserRole.Admin) {
    redirect("/");
  }

  return children;
}
