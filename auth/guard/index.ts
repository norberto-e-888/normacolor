import { getServerSession } from "@/functions/auth";

type ServerAction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export const adminGuard = <T extends ServerAction<T>>(action: T): T => {
  return (async (...args: Parameters<T>) => {
    const session = await getServerSession();

    if (!session || session.user.role !== "admin") {
      return {
        ok: false,
        message: "No tienes acceso a este recurso.",
      };
    }

    return action(...args);
  }) as T;
};
