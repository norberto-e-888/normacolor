import { useQuery } from "@tanstack/react-query";

import { Promotion, PromotionStatus } from "@/database";

export function usePromotions(status?: PromotionStatus) {
  return useQuery<Promotion[]>({
    queryKey: ["promotions", status],
    queryFn: async () => {
      const response = await fetch("/api/promotions?status=" + status);
      if (!response.ok) throw new Error("Failed to fetch promotions");
      const promotions = await response.json();
      console.log({ promotions });
      return promotions;
    },
  });
}
