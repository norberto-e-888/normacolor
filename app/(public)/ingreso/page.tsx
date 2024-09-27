"use client";

import { SignInButton } from "./SignInButton";
import { useSession } from "next-auth/react";
import { signInWithMagicLink } from "@/functions/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  return (
    <form action={signInWithMagicLink}>
      <input type="text" name="email" placeholder="Email" className="mx-2" />
      <SignInButton isLoadingSession={status === "loading"} />
    </form>
  );
}
