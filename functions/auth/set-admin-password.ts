"use server";

import * as bcrypt from "bcryptjs";

import { User, UserRole } from "@/database";
import { connectToMongo } from "@/lib/server";

import { getServerSession } from "./get-server-session";

export type SetAdminPasswordData = {
  password: string;
};

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/;

export const setAdminPassword = async (data: SetAdminPasswordData) => {
  const session = await getServerSession();

  if (!session || session.user.role !== UserRole.Admin) {
    return {
      ok: false,
      message: "No tienes acceso a este recurso.",
    };
  }

  await connectToMongo();

  const user = await User.findById(session?.user.id);

  if (!user) {
    return {
      ok: false,
      message:
        "Tu usuario fue borrado de la base de datos. Contacta con el administrador.",
    };
  }

  if (user.password) {
    return {
      ok: false,
      message:
        "Ya tienes contraseña, si la olvidaste, por favor empieza el flujo de recuperación.",
    };
  }

  if (!data.password) {
    return {
      ok: false,
      message: "Por favor ingresa la contraseña a usar.",
    };
  }

  const isPasswordSecure = strongPasswordRegex.test(data.password);

  if (!isPasswordSecure) {
    return {
      ok: false,
      message:
        "La contraseña debe tener una mayúscula, una minúscula, un número, un caracter especial y tener un total de por lo menos 10 caracteres.",
    };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await User.findByIdAndUpdate(user.id, {
    password: hashedPassword,
  });

  return {
    ok: true,
    message:
      "Ya tienes contraseña. Por favor vuelve a ingresar para culminar la configuración de tu usuario administrativo.",
  };
};
