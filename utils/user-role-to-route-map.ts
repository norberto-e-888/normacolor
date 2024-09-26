import { UserRole } from "@/models";

export const USER_ROLE_TO_ROUTE_MAP: {
  [key in UserRole]: string;
} = {
  [UserRole.Admin]: "/app/admin",
  [UserRole.Client]: "/app/cliente",
};
