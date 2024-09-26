import { auth, signIn } from "@/auth";
import { redirectUserToRoot } from "@/utils";

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirectUserToRoot(session.user);
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
