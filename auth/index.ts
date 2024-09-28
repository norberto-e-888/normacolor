import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth, { Session } from "next-auth";
import Resend from "next-auth/providers/resend";

import { connectToMongo, mongoClient } from "@/lib";
import { User, UserRole } from "@/database";

const { handlers, signIn, signOut, auth } = NextAuth({
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
    async signIn({ user, account }) {
      if (!account) {
        return false;
      }

      await connectToMongo();

      const userDocument = await User.findOne({
        email: user.email,
      });

      if (userDocument) {
        await User.findByIdAndUpdate(
          userDocument._id,
          {
            $addToSet: {
              providers: account.provider,
            },
          },
          { runValidators: true }
        );

        return true;
      }

      await User.create({
        email: user.email,
        providers: [account.provider],
      });

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

export { handlers, signIn, signOut, auth };
export type SessionUser = Pick<User, "id" | "email" | "role">;
