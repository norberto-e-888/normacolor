import { useQuery } from "@tanstack/react-query";

import { User } from "@/database";

export const useUser = () =>
  useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Failed to fetch user");
      const user = await response.json();
      return user;
    },
  });
