import { auth } from "@/auth";
import { UserRole } from "@/models";
import { redirectUserToRoot } from "@/utils";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session && session.user.role !== UserRole.Client) {
    redirectUserToRoot(session.user);
  }

  return children;
}
