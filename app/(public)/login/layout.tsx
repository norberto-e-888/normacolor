import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { UserRole } from "@/database";
import { getServerSession } from "@/functions/auth";

export default async function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (session) {
    redirect(session.user.role === UserRole.Admin ? "/admin" : "/");
  }

  return <SessionProvider>{children}</SessionProvider>;
}
