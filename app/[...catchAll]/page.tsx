import { auth } from "@/auth";
import { redirectUserToRoot } from "@/utils";
import { redirect } from "next/navigation";

export default async function CatchAllPage() {
  const session = await auth();

  if (session) {
    redirectUserToRoot(session.user);
  }

  redirect("/nosotros");
}
