"use client";

import { Hexagon, KeyRound, Loader, MailCheck, Send } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { OTPInput, SubmitButton } from "@/components/smart";
import { Button, Input, Separator } from "@/components/ui";
import { signInAsAdmin, signInWithMagicLink } from "@/functions/auth";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [code, setCode] = useState(params.get("code") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const isAdminFlow = params.get("isAdmin") === "true";
  const isAdminSettingPassword =
    params.get("isAdminSettingPassword") === "true";

  const callbackUrl = params.get("callbackUrl") || "/";

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
    const verify = params.get("verify");

    if (provider === "resend" && type === "email") {
      if (formRef.current) {
        formRef.current.reset();
      }

      router.replace("/login?verify=true");
    } else if (verify === "true") {
      const email = localStorage.getItem("sign-in.email");

      if (email) {
        setEmailToVerify(email);
      } else {
        router.replace("/login");
      }
    } else {
      setEmailToVerify("");
      localStorage.removeItem("sign-in.email");
    }
  }, [params, router]);

  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  }, []);

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

          {emailToVerify && !isAdminFlow && (
            <div className="flex">
              <MailCheck size="24px" className="animate-pulse mr-0.5" />
              <p className="text-sm text-muted-foreground text-center italic mt-0.5">
                te hemos enviado un correo a{" "}
                <span className="font-semibold">{emailToVerify}</span> con un
                link para que ingreses al app
              </p>
            </div>
          )}

          {emailToVerify && isAdminFlow && (
            <div className="flex">
              <KeyRound size="24px" className="animate-pulse mr-0.5" />
              <p className="text-sm text-muted-foreground text-center italic">
                crea tu contraseña e ingresa el código que enviamos a{" "}
                <span className="font-semibold">{emailToVerify}</span>
              </p>
            </div>
          )}

          {!emailToVerify && !isAdminFlow && (
            <p className="text-sm text-muted-foreground text-center italic">
              ingresa solo con tu correo, sin preocuparte por una nueva
              contraseña
            </p>
          )}

          <main>
            {isAdminFlow && (
              <form
                ref={formRef}
                className="flex flex-col gap-4 items-end justify-center"
                action={async (formData) => {
                  const password = formData.get("password") as string;
                  const passwordConfirm = formData.get(
                    "password-confirm"
                  ) as string;

                  if (isAdminSettingPassword && password !== passwordConfirm) {
                    return;
                  }

                  if (emailToVerify) {
                    await signInAsAdmin({
                      email: emailToVerify,
                      password,
                      code,
                    });
                  } else {
                    router.replace("/login");
                  }
                }}
              >
                <div className="flex flex-col items-center w-full">
                  <label className="block text-lg font-bold mb-2">Código</label>
                  <OTPInput defaultOTP={code} onChange={setCode} />
                </div>

                <div className="flex flex-col w-full mt-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold mb-1"
                  >
                    Contraseña
                  </label>
                  <Input
                    ref={passwordRef}
                    required
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      isAdminSettingPassword ? "off" : "current-password"
                    }
                    value={password}
                    onChange={(e) => {
                      e.preventDefault();
                      setPassword(e.target.value.trim());
                    }}
                  />
                </div>

                {isAdminSettingPassword && (
                  <div className="flex flex-col w-full mt-4">
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold mb-1"
                    >
                      Confirma tu contraseña
                    </label>
                    <Input
                      required
                      id="password-confirm"
                      name="password-confirm"
                      type="password"
                      autoComplete="off"
                      value={passwordConfirm}
                      onChange={(e) => {
                        e.preventDefault();
                        setPasswordConfirm(e.target.value.trim());
                      }}
                    />
                  </div>
                )}

                <SubmitButton
                  disabled={
                    status === "loading" ||
                    status === "authenticated" ||
                    code.length !== 6 ||
                    password.length < 10 ||
                    (isAdminSettingPassword && password !== passwordConfirm)
                  }
                  text={
                    status === "authenticated" ? (
                      <Loader size="20px" className="animate-spin" />
                    ) : (
                      "Ingresar"
                    )
                  }
                  className="w-full"
                />
              </form>
            )}

            {!isAdminFlow && (
              <form
                ref={formRef}
                className="flex gap-4 items-end justify-center"
                action={async (formData) => {
                  const email = formData.get("email") as string;

                  localStorage.setItem("sign-in.email", email);

                  await signInWithMagicLink(email, callbackUrl);
                }}
              >
                <div className="flex flex-col w-4/5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold mb-1"
                  >
                    Correo
                  </label>
                  <Input
                    required
                    id="email"
                    name="email"
                    type="email"
                    placeholder="yo@ejemplo.com"
                    autoComplete="email"
                  />
                </div>

                <SubmitButton
                  disabled={status === "loading" || status === "authenticated"}
                  text={
                    status === "authenticated" ? (
                      <Loader size="20px" className="animate-spin" />
                    ) : (
                      <Send size="20px" />
                    )
                  }
                  className="w-1/5"
                />
              </form>
            )}

            {!isAdminFlow && (
              <>
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
                      priority
                    />
                  </Button>
                  <Button variant="outline">
                    <Image
                      src="/svg/facebook.svg"
                      alt="Facebook Sign In"
                      width="24"
                      height="24"
                      priority
                    />
                  </Button>
                  <Button variant="outline">
                    <Image
                      src="/svg/twitter.svg"
                      alt="Twitter Sign In"
                      width="24"
                      height="24"
                      priority
                    />
                  </Button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
