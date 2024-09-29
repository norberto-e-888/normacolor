import { redirect } from "next/navigation";

import { AdminLayout } from "@/components/smart/admin-layout"; // don't import from barrel file
import { getServerSession } from "@/functions/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <AdminLayout user={session.user}>{children}</AdminLayout>;
}
