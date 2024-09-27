import { auth } from "@/auth";
import { signInWithMagicLink } from "@/actions";
import { redirectUserToRoot } from "@/utils";

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirectUserToRoot(session.user);
  }

  return (
    <form action={signInWithMagicLink}>
      <input type="text" name="email" placeholder="Email" className="mx-2" />
      <button type="submit" className="border-2 border-cyan-600">
        Ingresa
      </button>
    </form>
  );
}
