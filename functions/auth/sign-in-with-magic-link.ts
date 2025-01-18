"use server";

import { signIn } from "@/auth";
// also sends OTPs to admins

export const signInWithMagicLink = async (email: string, callbackUrl = "/") => {
  await signIn("resend", {
    email,
    redirectTo: callbackUrl,
  });
};
