/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";

import { Product, ProductPricingOptionMultipliers } from "@/database";
import { useCart } from "@/hooks/useCart";

const formatOptionLabel = (option: string) => {
  return option
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase());
};

export function ProductCard({ product }: { product: Product }) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((state) => state.addItem);

  const calculatePrice = () => {
    let price = product.pricing.baseUnitPrice;

    // Apply option multipliers
    Object.entries(selectedOptions).forEach(([key, value]) => {
      const typedKey = key as keyof ProductPricingOptionMultipliers;
      const optionMultiplier = product.pricing.optionMultipliers[typedKey];
      const multiplier = optionMultiplier
        ? optionMultiplier[value as keyof typeof optionMultiplier]
        : undefined;

      if (multiplier) {
        price *= multiplier as number;
      }
    });

    // Apply quantity discount
    const discounts = product.pricing.quantityDiscountMultipliers || [];
    const applicableDiscount = discounts
      .sort((a, b) => b[0] - a[0])
      .find(([threshold]) => quantity >= threshold);

    if (applicableDiscount) {
      price *= applicableDiscount[1];
    }

    return price * quantity;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addItem({
      productId: product.id,
      name: product.name,
      quantity,
      options: selectedOptions,
      price: calculatePrice(),
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-primary transition-colors w-full max-w-sm">
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <span className="text-2xl text-muted-foreground">📄</span>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold capitalize">{product.name}</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {product.options.sides && (
            <div>
              <label className="block text-sm font-medium mb-1">Lados</label>
              <select
                className="w-full border rounded-md p-2"
                onChange={(e) =>
                  setSelectedOptions((prev) => ({
                    ...prev,
                    sides: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seleccionar lado</option>
                {product.options.sides.map((side) => (
                  <option key={side} value={side}>
                    {formatOptionLabel(side)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {product.options.paper && (
            <div>
              <label className="block text-sm font-medium mb-1">Papel</label>
              <select
                className="w-full border rounded-md p-2"
                onChange={(e) =>
                  setSelectedOptions((prev) => ({
                    ...prev,
                    paper: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seleccionar papel</option>
                {product.options.paper.map((paper) => (
                  <option key={paper} value={paper}>
                    {formatOptionLabel(paper)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {product.options.finish && (
            <div>
              <label className="block text-sm font-medium mb-1">Acabado</label>
              <select
                className="w-full border rounded-md p-2"
                onChange={(e) =>
                  setSelectedOptions((prev) => ({
                    ...prev,
                    finish: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seleccionar acabado</option>
                {product.options.finish.map((finish) => (
                  <option key={finish} value={finish}>
                    {formatOptionLabel(finish)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {product.options.dimensions && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Dimensiones
              </label>
              <select
                className="w-full border rounded-md p-2"
                onChange={(e) =>
                  setSelectedOptions((prev) => ({
                    ...prev,
                    dimensions: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seleccionar dimensiones</option>
                {product.options.dimensions.map((dim) => (
                  <option key={dim.join("x")} value={JSON.stringify(dim)}>
                    {dim[0]}" x {dim[1]}"
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">
              ${calculatePrice().toFixed(2)}
            </span>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Agregar al carrito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
