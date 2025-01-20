import { OrderProductOptions, Product } from "@/database";

export const getForcedOptions = (product: Product<true> | Product<false>) => {
  const forcedOptions: Partial<OrderProductOptions> = {};

  Object.entries(product.options).forEach(([key, value]) => {
    if (value.length === 1) {
      forcedOptions[key as keyof OrderProductOptions] = value[0] as never;
    }
  });

  return forcedOptions;
};
