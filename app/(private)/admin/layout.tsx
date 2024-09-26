import { auth } from "@/auth";
import { UserRole } from "@/models";
import { redirectUserToRoot } from "@/utils";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session && session.user.role !== UserRole.Admin) {
    redirectUserToRoot(session.user);
  }

  return children;
}
