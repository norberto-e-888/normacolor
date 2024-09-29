"use client";

import { Hexagon, Loader, Send } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { SubmitButton } from "@/components/smart";
import { Button, Input, Separator } from "@/components/ui";
import { signInWithMagicLink } from "@/functions/auth";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (status === "authenticated") {
      timeout = setTimeout(() => {
        router.replace("/");
      }, 800);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [status, router]);

  return (
    <>
      <div className="hidden xl:block xl:w-1/2 relative">
        <Image
          src="/images/login-hero.svg"
          alt="Hero image"
          fill
          sizes="50vw"
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      <div className="w-full xl:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Hexagon size="96px" />
          </div>
          <p className="text-sm text-muted-foreground text-center italic">
            Ingresa solo con tu correo, sin preocuparte por una nueva contraseña
          </p>
          <main>
            <form
              className="flex gap-4 items-end justify-center"
              action={signInWithMagicLink}
            >
              <div className="flex flex-col w-full">
                <label htmlFor="email" className="block text-sm font-bold mb-1">
                  Correo
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="yo@ejemplo.com"
                  required
                />
              </div>

              <SubmitButton
                disabled={status === "loading" || status === "authenticated"}
                pendingText={<Loader size="20px" className="animate-spin" />}
                settledText={
                  status === "authenticated" ? (
                    "Ingresando..."
                  ) : (
                    <Send size="20px" />
                  )
                }
              />
            </form>

            <div className="relative">
              <Separator className="my-8" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                O continua con
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline">Google</Button>
              <Button variant="outline">Twitter</Button>
              <Button variant="outline">Instagram</Button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
