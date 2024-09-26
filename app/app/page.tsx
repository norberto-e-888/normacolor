import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppRootPage() {
  const session = await auth();
  redirect(session ? `/app/${session.user.role}` : "/ingreso");
}
