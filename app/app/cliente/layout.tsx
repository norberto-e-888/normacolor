import { auth } from "@/auth";
import { UserRole } from "@/models";
import { USER_ROLE_TO_ROUTE_MAP } from "@/utils";
import { redirect } from "next/navigation";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session || session.user.role !== UserRole.Client) {
    redirect(session ? USER_ROLE_TO_ROUTE_MAP[session.user.role] : "/ingreso");
  }

  return children;
}
