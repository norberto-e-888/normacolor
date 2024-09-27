import { redirect } from "next/navigation";

import { SessionUser } from "@/auth";
import { config } from "@/config";
import { UserRole } from "@/models";

export const USER_ROLE_TO_ROOT_MAP: {
  [key in UserRole]: string;
} = {
  [UserRole.Admin]: config.USER_ADMIN_ROOT,
  [UserRole.Client]: config.USER_CLIENT_ROOT,
};

export const redirectUserToRoot = (user: SessionUser) =>
  redirect(USER_ROLE_TO_ROOT_MAP[user.role]);
