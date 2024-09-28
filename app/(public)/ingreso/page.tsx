"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { FormButton } from "@/components";
import { signInWithMagicLink } from "@/functions/auth";

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
      <FormButton
        disabled={status === "loading"}
        settledText="Ingresa"
        pendingText="Ingresando..."
      />
    </form>
  );
}
