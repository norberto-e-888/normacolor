"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { PromotionStatus } from "@/database";

export function Effects() {
  const session = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["promotions", PromotionStatus.Active],
      queryFn: async () => {
        const response = await fetch(
          "/api/promotions?status=" + PromotionStatus.Active
        );
        if (!response.ok) throw new Error("Failed to fetch promotions");
        const promotions = await response.json();
        console.log({ promotions });
        return promotions;
      },
    });
  }, [queryClient]);

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["me"],
      queryFn: async () => {
        const response = await fetch("/api/auth/me");
        if (!response.ok) throw new Error("Failed to fetch user");
        const user = await response.json();
        console.log({ user });
        return user;
      },
    });
  }, [queryClient, session.status]);

  return <></>;
}
