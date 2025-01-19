"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { Promotion, PromotionStatus } from "@/database";

interface PromotionDraftsProps {
  onPromotionSelect: (promotion: Promotion) => void;
}

export function PromotionDrafts({ onPromotionSelect }: PromotionDraftsProps) {
  const { data: drafts = [] } = useQuery<Promotion[]>({
    queryKey: ["draft-promotions"],
    queryFn: async () => {
      const response = await fetch(
        "/api/promotions?status=" + PromotionStatus.Draft
      );
      if (!response.ok) throw new Error("Failed to fetch drafts");
      return response.json();
    },
  });

  if (drafts.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
        No draft promotions
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drafts.map((draft) => (
        <motion.div
          key={draft.id}
          className="bg-card rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
          onClick={() => onPromotionSelect(draft)}
        >
          <div className="p-4">
            <h3 className="font-medium mb-2">{draft.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {draft.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
