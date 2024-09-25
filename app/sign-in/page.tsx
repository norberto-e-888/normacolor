import { auth, signIn, signOut } from "@/auth";

export default async function SignIn() {
  const session = await auth();

  return (
    <>
      {!session && (
        <form
          action={async (formData) => {
            "use server";
            await signIn("resend", formData);
          }}
        >
          <input type="text" name="email" placeholder="Email" />
          <button type="submit">Sign In with Magic Link</button>
        </form>
      )}

      {session && (
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button type="submit">
            Sign Out ({session.user.email}, {session.user.role})
          </button>
        </form>
      )}
    </>
  );
}
