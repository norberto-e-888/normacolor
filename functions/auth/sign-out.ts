"use client";

import { signOut as _signOut } from "next-auth/react";

export const signOut = async () => {
  await _signOut({ redirectTo: "/login" });
};
