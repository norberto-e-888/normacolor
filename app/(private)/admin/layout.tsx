import { auth } from "@/auth";
import { UserRole } from "@/models";
import { config } from "@/config";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session && session.user.role !== UserRole.Admin) {
    redirect(config.USER_ROLE_TO_ROOT_MAP[session.user.role]);
  }

  return children;
}
