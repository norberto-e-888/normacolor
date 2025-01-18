import { redirect } from "next/navigation";

import { UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";

export default async function AdminClientsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== UserRole.Admin) {
    redirect("/");
  }

  return <>{children}</>;
}
