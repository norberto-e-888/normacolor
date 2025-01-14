import { UserRole } from "@/database";

export type Route = {
  path: string;
  label: string;
  isPublic?: boolean;
  roles?: UserRole[];
};

export const routes: Route[] = [
  {
    path: "/productos",
    label: "Productos",
    isPublic: true,
  },
  {
    path: "/ordenes",
    label: "Ordenes",
    isPublic: false,
    roles: [UserRole.Client],
  },
  {
    path: "/checkout",
    label: "Carrito",
    isPublic: true,
  },
];
