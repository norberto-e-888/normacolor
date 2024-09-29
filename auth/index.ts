import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";

import { OTP, User, UserRole } from "@/database";
import { connectToMongo, getMongoClient } from "@/lib/server";

import { sendVerificationRequest } from "./utils";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;

const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Resend({
      from: "onboarding@resend.dev",
      sendVerificationRequest,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
        code: {},
      },
      authorize: async ({ email, password, code }) => {
        if (
          typeof email !== "string" ||
          typeof password !== "string" ||
          typeof code !== "string"
        ) {
          throw new Error("Credenciales invalidas.");
        }

        const user = await User.findOne({
          email,
        });

        if (!user || user.role !== UserRole.Admin) {
          throw new Error("Credenciales invalidas.");
        }

        const otp = await OTP.findOne({
          requestedBy: user.email,
        });

        if (!otp || otp.isExpired()) {
          throw new Error(
            "Tu código expiró. Pide uno nuevo, recuerda que por seguridad solo duran 5 minutos."
          );
        }

        const isCodeValid = await otp.checkCode(code);

        if (!isCodeValid) {
          throw new Error("Código invalido.");
        }

        if (user.password) {
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            throw new Error("Credenciales invalidas.");
          }
        }

        if (!user.password && otp.isPasswordSetting) {
          const isPasswordSecure = strongPasswordRegex.test(password);

          if (!isPasswordSecure) {
            throw new Error(
              "La contraseña debe tener una mayúscula, una minúscula, un número, un caracter especial y tener un total de por lo menos 10 caracteres."
            );
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          await User.findByIdAndUpdate(user.id, {
            password: hashedPassword,
          });
        }

        if (!user.password && !otp.isPasswordSetting) {
          throw new Error(
            "Por favor contactar al administrador y suplementar código de error: OTP_PASS_MISMATCH"
          );
        }

        return user.toObject();
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
