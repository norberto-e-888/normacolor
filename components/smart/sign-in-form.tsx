"use client";

import { signInWithMagicLink } from "@/functions/auth";
import { SubmitButton } from "./submit-button";
import { Button, Separator } from "../ui";

export const SignInForm = ({ disabled = false }: { disabled?: boolean }) => (
  <>
    <form action={signInWithMagicLink}>
      <input type="text" name="email" placeholder="Email" className="mx-2" />
      <SubmitButton
        disabled={disabled}
        settledText="Ingresa"
        pendingText="Ingresando..."
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
  </>
);
