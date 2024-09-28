"use server";

import { auth, SessionUser } from "@/auth";
import { Session } from "next-auth";

export const getServerSession = async () => {
  const session = await auth();

  return session as
    | (Session & {
        user: SessionUser;
      })
    | null;
};
