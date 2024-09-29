import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";

import { User, UserRole } from "@/database";
import { connectToMongo, getMongoClient } from "@/lib/server";

const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Resend({
      from: "onboarding@resend.dev",
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async ({ email, password }) => {
        if (typeof email !== "string" || typeof password !== "string") {
          throw new Error("Credenciales invalidas.");
        }

        const user = await User.findOne({
          email,
        });

        if (!user || user.role !== UserRole.Admin) {
          throw new Error("Credenciales invalidas.");
        }

        if (!user.password) {
          throw new Error("Porfavor configura una contraseña.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Credenciales invalidas.");
        }

        return user;
      },
    }),
  ],
  adapter: MongoDBAdapter(getMongoClient),
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
  pages: {
    verifyRequest: "/login",
  },
});

export { auth, handlers, signIn, signOut };
export type SessionUser = Pick<User, "id" | "email" | "role">;
