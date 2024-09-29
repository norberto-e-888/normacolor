"use client";

import { Hexagon, Loader, Send } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/smart";
import { Button, Input, Separator } from "@/components/ui";
import { signInWithMagicLink } from "@/functions/auth";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [emailToVerify, setEmailToVerify] = useState("");

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

  useEffect(() => {
    const provider = params.get("provider");
    const type = params.get("type");

    if (provider === "resend" && type === "email") {
      const email = localStorage.getItem("sign-in.email");

      if (email) {
        setEmailToVerify(email);
      }

      if (formRef.current) {
        formRef.current.reset();
      }
    } else {
      setEmailToVerify("");
      localStorage.removeItem("sign-in.email");
    }
  }, [params]);

  return (
    <>
      <div className="hidden xl:block xl:w-1/2 relative">
        <Image
          src="/svg/login-hero.svg"
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
            {emailToVerify ? (
              <>
                te hemos enviado un correo a{" "}
                <span className="font-semibold">{emailToVerify}</span> con un
                link para que ingreses al app
              </>
            ) : (
              "ingresa solo con tu correo, sin preocuparte por una nueva contraseña"
            )}
          </p>

          <main>
            <form
              ref={formRef}
              className="flex gap-4 items-end justify-center"
              action={async (formData) => {
                const email = formData.get("email");

                localStorage.setItem("sign-in.email", email as string);

                await signInWithMagicLink(formData);
              }}
            >
              <div className="flex flex-col w-4/5">
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
                    <Loader size="20px" className="animate-spin" />
                  ) : (
                    <Send size="20px" />
                  )
                }
                className="w-1/5"
              />
            </form>

            <div className="relative">
              <Separator className="my-8" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                O continua con
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline">
                <Image
                  src="/svg/google.svg"
                  alt="Google Sign In"
                  width="24"
                  height="24"
                />
              </Button>
              <Button variant="outline">
                <Image
                  src="/svg/facebook.svg"
                  alt="Facebook Sign In"
                  width="24"
                  height="24"
                />
              </Button>
              <Button variant="outline">
                {" "}
                <Image
                  src="/svg/twitter.svg"
                  alt="Twitter Sign In"
                  width="24"
                  height="24"
                />
              </Button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
