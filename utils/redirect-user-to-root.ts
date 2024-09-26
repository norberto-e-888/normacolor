import { config } from "@/config";
import { SessionUser } from "@/auth";
import { UserRole } from "@/models";
import { redirect } from "next/navigation";

export const redirectUserToRoot = (user: SessionUser) =>
  redirect(
    {
      [UserRole.Admin]: config.USER_ADMIN_ROOT,
      [UserRole.Client]: config.USER_CLIENT_ROOT,
    }[user.role]
  );
