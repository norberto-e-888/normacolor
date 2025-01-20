"use client";

import { format } from "date-fns";
import { Promotion, PromotionStatus } from "@/database";
import { usePromotions } from "@/hooks/use-promotions";
import { formatNumber } from "@/utils";
import { promotionTypeLabels } from "@/utils/promotion-translations";

interface PromotionHistoryProps {
  onPromotionSelect: (promotion: Promotion) => void;
}

export function PromotionHistory({ onPromotionSelect }: PromotionHistoryProps) {
  const { data: history = [] } = usePromotions(PromotionStatus.Ended);

  if (history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground border rounded-lg">
        No hay promociones pasadas
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-4 font-medium">Nombre</th>
            <th className="text-left p-4 font-medium">Tipo</th>
            <th className="text-left p-4 font-medium">Puntos</th>
            <th className="text-left p-4 font-medium">Canjeos</th>
            <th className="text-left p-4 font-medium">Fin</th>
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
                {promotionTypeLabels[promotion.type]}
              </td>
              <td className="p-4">{formatNumber(promotion.pointsCost)}</td>
              <td className="p-4">
                {promotion.currentRedemptions}
                {promotion.maxRedemptions
                  ? ` / ${formatNumber(promotion.maxRedemptions)}`
                  : ""}
              </td>
              <td className="p-4">
                {promotion.endDate
                  ? format(new Date(promotion.endDate), "d MMM, yyyy")
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
