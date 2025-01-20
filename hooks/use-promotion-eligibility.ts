import { Promotion, PromotionConditionType, User } from "@/database";

import { useCart } from "./use-cart";

export function usePromotionEligibility() {
  const cart = useCart();
  const checkEligibility = (user: User, promotions: Promotion[]) => {
    return promotions.filter((promotion) => {
      console.log({ promotion });
      const meetsConditions = promotion.conditions.every((condition) => {
        switch (condition.type) {
          case PromotionConditionType.MinOrderValue:
            return cart.totalPrice() >= (condition.value as number) * 100;
          case PromotionConditionType.MinOrderCount:
            return cart.totalItems() >= (condition.value as number);
          case PromotionConditionType.SpecificProducts:
            const productIds = condition.value as string[];
            return cart.items.some((item) =>
              productIds.includes(item.productId)
            );

          default:
            return false;
        }
      });

      const meetsPointsRequirement = user
        ? promotion.pointsCost
          ? user.unspentLoyaltyPoints >= promotion.pointsCost // points required
          : true // no points required
        : false; // not logged in

      return meetsConditions && meetsPointsRequirement;
    });
  };

  return {
    checkEligibility,
  };
}
