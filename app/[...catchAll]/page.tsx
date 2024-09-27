import { getServerSession } from "@/functions/auth";
import { redirectUserToRoot } from "@/utils";
import { redirect } from "next/navigation";

export default async function CatchAllPage() {
  const session = await getServerSession();

  if (session) {
    redirectUserToRoot(session.user);
  }

  redirect("/ingreso");
}
