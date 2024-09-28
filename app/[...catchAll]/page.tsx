import { redirect } from "next/navigation";

import { getServerSession } from "@/functions/auth";
import { UserRole } from "@/database";

export default async function CatchAllPage() {
  const session = await getServerSession();

  if (session) {
    redirect(session.user.role === UserRole.Admin ? "/admin" : "/");
  }

  redirect("/ingreso");
}
