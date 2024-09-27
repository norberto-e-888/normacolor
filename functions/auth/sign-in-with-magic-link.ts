"use server";

import { signIn } from "@/auth";

export const signInWithMagicLink = async (formData: FormData) => {
  await signIn("resend", {
    email: formData.get("email"),
    redirectTo: "/",
  });
};
