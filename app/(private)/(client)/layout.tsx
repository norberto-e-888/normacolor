import { redirect } from "next/navigation";

import { getServerSession } from "@/functions/auth";
import { UserRole } from "@/database";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (session && session.user.role !== UserRole.Client) {
    redirect("/admin");
  }

  return children;
}
