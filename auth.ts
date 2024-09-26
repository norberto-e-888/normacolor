import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth, { Session } from "next-auth";
import Resend from "next-auth/providers/resend";
import { mongoClient, connectToMongo } from "./lib";
import { User, UserRole } from "./models";

const { handlers, signIn, signOut, ...rest } = NextAuth({
  providers: [
    Resend({
      from: "onboarding@resend.dev",
    }),
  ],
  adapter: MongoDBAdapter(mongoClient),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      await connectToMongo();

      const userDocument = await User.findOne({
        email: user.email,
      });

      if (!userDocument) {
        await User.create({
          email: user.email,
        });
      }

      return true;
    },
    async jwt({ user, token }) {
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as unknown as User).role = token.role as UserRole;

      return session;
    },
  },
});

const auth = async () =>
  rest.auth() as unknown as
    | (Session & {
        user: SessionUser;
      })
    | null;

export { handlers, signIn, signOut, auth };
export type SessionUser = Pick<User, "id" | "email" | "role">;
