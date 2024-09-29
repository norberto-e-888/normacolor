import { redirect } from "next/navigation";

import { AdminLayout } from "@/components/smart/admin-layout"; // don't import from barrel file
import { UserRole } from "@/database";
import { getServerSession } from "@/functions/auth";

export default async function AdminAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.Admin) {
    redirect("/");
  }

  return <AdminLayout user={session.user}>{children}</AdminLayout>;
}
