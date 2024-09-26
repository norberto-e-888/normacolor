import { auth } from "@/auth";
import { USER_ROLE_TO_ROUTE_MAP } from "@/utils";
import { redirect } from "next/navigation";

export default async function AppRootPage() {
  const session = await auth();
  redirect(session ? USER_ROLE_TO_ROUTE_MAP[session.user.role] : "/ingreso");
}
