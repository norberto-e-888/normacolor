import { OrderProduct, ProductPricing } from "@/database";

export const calculatePrice = (
  quantity: number,
  pricing: ProductPricing,
  options: OrderProduct["options"]
): number => {
  if (!quantity || quantity < 1) return 0;

  let price = pricing.baseUnitPrice;

  // Apply option multipliers
  Object.entries(options).forEach(([key, value]) => {
    const optionMultiplier =
      pricing.optionMultipliers[key as keyof typeof pricing.optionMultipliers];

    if (optionMultiplier) {
      const multiplier =
        optionMultiplier[value as keyof typeof optionMultiplier];
      if (multiplier) {
        price *= multiplier as number;
      }
    }
  });

  // Apply quantity discount
  const discounts = pricing.quantityDiscountMultipliers || [];
  const applicableDiscount = discounts
    .sort((a, b) => b[0] - a[0])
    .find(([threshold]) => quantity >= threshold);

  if (applicableDiscount) {
    price *= applicableDiscount[1];
  }

  return Math.round(price * quantity);
};
