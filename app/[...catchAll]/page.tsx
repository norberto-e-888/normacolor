import { redirect } from "next/navigation";

import { UserRole } from "@/database";
import { getServerSession } from "@/functions/auth";

export default async function CatchAllPage() {
  const session = await getServerSession();

  if (session) {
    redirect(session.user.role === UserRole.Admin ? "/admin" : "/");
  }

  redirect("/ingreso");
}
