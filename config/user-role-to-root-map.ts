import { UserRole } from "@/models";

export const USER_ROLE_TO_ROOT_MAP: {
  [key in UserRole]: string;
} = {
  [UserRole.Admin]: "/admin",
  [UserRole.Client]: "/",
};
