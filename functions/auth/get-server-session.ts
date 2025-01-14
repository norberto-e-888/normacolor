"use server";

import { Session } from "next-auth";

import { auth, SessionUser } from "@/auth";

export const getServerSession = async () => {
  const session = await auth();
  return session as ExtendedSession | null;
};

export type ExtendedSession = Session & {
  user: SessionUser;
};
