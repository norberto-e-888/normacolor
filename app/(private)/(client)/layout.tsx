import { redirect } from "next/navigation";

import { UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";

export default async function ClientAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await getServerSession()) as ExtendedSession;

  if (session?.user.role !== UserRole.Client) {
    redirect("/admin");
  }

  return <>{children}</>;
}
