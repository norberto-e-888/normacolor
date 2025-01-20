import { useQuery } from "@tanstack/react-query";

import { Promotion, PromotionStatus } from "@/database";

export function usePromotions(status?: PromotionStatus) {
  return useQuery<Promotion[]>({
    queryKey: ["promotions", status],
    queryFn: async () => {
      const url = new URL("/api/promotions", window.location.origin);
      if (status) {
        url.searchParams.set("status", status);
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch promotions");
      return response.json();
    },
  });
}
