import { auth } from "@/auth";
import { config } from "@/config";
import { redirect } from "next/navigation";

export default async function CatchAllPage() {
  const session = await auth();

  if (session) {
    redirect(config.USER_ROLE_TO_ROOT_MAP[session.user.role]);
  }

  redirect("/nosotros");
}
