"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Promotion, PromotionStatus } from "@/database";

interface PromotionHistoryProps {
  onPromotionSelect: (promotion: Promotion) => void;
}

export function PromotionHistory({ onPromotionSelect }: PromotionHistoryProps) {
  const { data: history = [] } = useQuery<Promotion[]>({
    queryKey: ["ended-promotions"],
    queryFn: async () => {
      const response = await fetch(
        "/api/promotions?status=" + PromotionStatus.Ended
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  if (history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
        No ended promotions
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-4 font-medium">Name</th>
            <th className="text-left p-4 font-medium">Type</th>
            <th className="text-left p-4 font-medium">Points Cost</th>
            <th className="text-left p-4 font-medium">End Date</th>
            <th className="text-left p-4 font-medium">Redemptions</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((promotion) => (
            <tr
              key={promotion.id}
              className="border-t hover:bg-muted/50 cursor-pointer"
              onClick={() => onPromotionSelect(promotion)}
            >
              <td className="p-4">{promotion.name}</td>
              <td className="p-4 capitalize">
                {promotion.type.replace(/_/g, " ")}
              </td>
              <td className="p-4">{promotion.pointsCost}</td>
              <td className="p-4">
                {promotion.endDate
                  ? format(new Date(promotion.endDate), "MMM d, yyyy")
                  : "-"}
              </td>
              <td className="p-4">
                {promotion.currentRedemptions}
                {promotion.maxRedemptions
                  ? ` / ${promotion.maxRedemptions}`
                  : ""}
              </td>
              <td className="p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        // Clone promotion logic here
                      }}
                    >
                      Clone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
