"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { PromotionStatus } from "@/database";

export default function ProductsPageEffects() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["active-promotions"],
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

  return <></>;
}
