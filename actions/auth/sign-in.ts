"use server";

import { signIn as _signIn } from "@/auth";

export const signIn = async (formData: FormData) => {
  await _signIn("resend", {
    email: formData.get("email"),
    redirectTo: "/app",
  });
};
