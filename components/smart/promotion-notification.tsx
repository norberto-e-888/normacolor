"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import { PromotionStatus } from "@/database";
import { useCart } from "@/hooks/use-cart";
import { usePromotionEligibility } from "@/hooks/use-promotion-eligibility";
import { usePromotions } from "@/hooks/use-promotions";
import { useUser } from "@/hooks/use-user";

export function PromotionNotifications() {
  const { checkEligibility } = usePromotionEligibility();
  const promotionsQuery = usePromotions(PromotionStatus.Active);
  const userQuery = useUser();
  const cart = useCart();
  const promotions = useMemo(
    () => promotionsQuery.data,
    [promotionsQuery.data]
  );

  useEffect(() => {
    if (!promotions || !userQuery.data) {
      return;
    }

    const eligiblePromotions = checkEligibility(userQuery.data, promotions);
    eligiblePromotions.forEach((promotion) => {
      toast.success(`¡Aplicas para una promoción! ${promotion.name}`, {
        description: promotion.description,
        action: {
          label: "Ver detalles",
          onClick: () => {
            // Show promotion details
          },
        },
        id: promotion.id,
        duration: Infinity,
      });
    });
  }, [cart.items, checkEligibility, promotions, userQuery.data]);

  return null;
}
