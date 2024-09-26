import { auth, signIn } from "@/auth";
import { USER_ROLE_TO_ROOT_MAP } from "@/utils";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirect(USER_ROLE_TO_ROOT_MAP[session.user.role]);
  }

  return (
    <>
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", {
            email: formData.get("email"),
            redirectTo: "/app",
          });
        }}
      >
        <input type="text" name="email" placeholder="Email" />
        <button type="submit">Sign In with Magic Link</button>
      </form>
    </>
  );
}
