import { signIn } from "@/actions";
import { auth } from "@/auth";
import { redirectUserToRoot } from "@/utils";

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirectUserToRoot(session.user);
  }

  return (
    <>
      <form action={signIn}>
        <input type="text" name="email" placeholder="Email" />
        <button type="submit">Sign In with Magic Link</button>
      </form>
    </>
  );
}
