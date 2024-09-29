"use server";

import { signIn } from "@/auth";

export const signInAsAdmin = async (data: {
  email: string;
  password: string;
  code: string;
}) => {
  await signIn("credentials", {
    ...data,
    redirectTo: "/admin",
  });
};
