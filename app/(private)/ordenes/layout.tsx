import { redirect } from "next/navigation";

import { UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";

export default async function OrdersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await getServerSession()) as ExtendedSession;

  if (session?.user.role === UserRole.Admin) {
    redirect("/admin");
  } else if (!session) {
    redirect("/productos");
  }

  return <>{children}</>;
}
