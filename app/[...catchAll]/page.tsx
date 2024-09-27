import { redirect } from "next/navigation";

import { getServerSession } from "@/functions/auth";
import { redirectUserToRoot } from "@/utils";

export default async function CatchAllPage() {
  const session = await getServerSession();

  if (session) {
    redirectUserToRoot(session.user);
  }

  redirect("/ingreso");
}
