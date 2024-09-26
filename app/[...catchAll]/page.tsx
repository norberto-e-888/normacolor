import { auth } from "@/auth";
import { USER_ROLE_TO_ROOT_MAP } from "@/utils";
import { redirect } from "next/navigation";

export default async function CatchAllPage() {
  const session = await auth();

  if (session) {
    redirect(USER_ROLE_TO_ROOT_MAP[session.user.role]);
  }

  redirect("/nosotros");
}
