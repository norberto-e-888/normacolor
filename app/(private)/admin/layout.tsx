import { getServerSession } from "@/functions/auth";
import { UserRole } from "@/models";
import { redirectUserToRoot } from "@/utils";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (session && session.user.role !== UserRole.Admin) {
    redirectUserToRoot(session.user);
  }

  return children;
}
