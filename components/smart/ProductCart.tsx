/* eslint-disable react/no-unescaped-entities */
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Tooltip } from "@/components/ui";
import { Product, ProductPricingOptionMultipliers } from "@/database";
import { useCart } from "@/hooks/useCart";

const formatOptionLabel = (option: string) => {
  return option
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase());
};

const TOOLTIP_TEXT = "única opción disponible";

export function ProductCard({ product }: { product: Product }) {
  const getDefaultOptions = useCallback(() => {
    const defaultOptions: Record<string, string> = {};

    if (product.options.sides?.length === 1) {
      defaultOptions.sides = product.options.sides[0];
    }
    if (product.options.paper?.length === 1) {
      defaultOptions.paper = product.options.paper[0];
    }
    if (product.options.finish?.length === 1) {
      defaultOptions.finish = product.options.finish[0];
    }
    if (product.options.dimensions?.length === 1) {
      defaultOptions.dimensions = JSON.stringify(product.options.dimensions[0]);
    }

    return defaultOptions;
  }, [
    product.options.dimensions,
    product.options.finish,
    product.options.paper,
    product.options.sides,
  ]);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(getDefaultOptions());
  const [quantity, setQuantity] = useState<number | "">(1);
  const addItem = useCart((state) => state.addItem);

  const calculatePrice = () => {
    const qty = typeof quantity === "number" ? quantity : 0;
    if (!qty || qty < 1) return 0;

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
      .find(([threshold]) => qty >= threshold);

    if (applicableDiscount) {
      price *= applicableDiscount[1];
    }

    return price * qty;
  };

  const isFormComplete = () => {
    // Check if all required options are selected
    if (product.options.sides && !selectedOptions.sides) return false;
    if (product.options.paper && !selectedOptions.paper) return false;
    if (product.options.finish && !selectedOptions.finish) return false;
    if (product.options.dimensions && !selectedOptions.dimensions) return false;
    if (typeof quantity !== "number" || quantity < 1) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof quantity !== "number") return;

    addItem({
      productId: product.id,
      name: product.name,
      quantity,
      options: selectedOptions,
      price: calculatePrice(),
    });

    // Reset form while keeping default values
    setSelectedOptions(getDefaultOptions());
    setQuantity(1);

    // Show success toast
    toast.success(
      `${quantity} ${product.name} agregado${
        quantity > 1 ? "s" : ""
      } al carrito`
    );
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
              {product.options.sides.length === 1 ? (
                <Tooltip text={TOOLTIP_TEXT}>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedOptions.sides || ""}
                    disabled
                    required
                  >
                    <option value={product.options.sides[0]}>
                      {formatOptionLabel(product.options.sides[0])}
                    </option>
                  </select>
                </Tooltip>
              ) : (
                <select
                  className="w-full border rounded-md p-2"
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      sides: e.target.value,
                    }))
                  }
                  value={selectedOptions.sides || ""}
                  required
                >
                  <option value="">Seleccionar lado</option>
                  {product.options.sides.map((side) => (
                    <option key={side} value={side}>
                      {formatOptionLabel(side)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {product.options.paper && (
            <div>
              <label className="block text-sm font-medium mb-1">Papel</label>
              {product.options.paper.length === 1 ? (
                <Tooltip text={TOOLTIP_TEXT}>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedOptions.paper || ""}
                    disabled
                    required
                  >
                    <option value={product.options.paper[0]}>
                      {formatOptionLabel(product.options.paper[0])}
                    </option>
                  </select>
                </Tooltip>
              ) : (
                <select
                  className="w-full border rounded-md p-2"
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      paper: e.target.value,
                    }))
                  }
                  value={selectedOptions.paper || ""}
                  required
                >
                  <option value="">Seleccionar papel</option>
                  {product.options.paper.map((paper) => (
                    <option key={paper} value={paper}>
                      {formatOptionLabel(paper)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {product.options.finish && (
            <div>
              <label className="block text-sm font-medium mb-1">Acabado</label>
              {product.options.finish.length === 1 ? (
                <Tooltip text={TOOLTIP_TEXT}>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedOptions.finish || ""}
                    disabled
                    required
                  >
                    <option value={product.options.finish[0]}>
                      {formatOptionLabel(product.options.finish[0])}
                    </option>
                  </select>
                </Tooltip>
              ) : (
                <select
                  className="w-full border rounded-md p-2"
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      finish: e.target.value,
                    }))
                  }
                  value={selectedOptions.finish || ""}
                  required
                >
                  <option value="">Seleccionar acabado</option>
                  {product.options.finish.map((finish) => (
                    <option key={finish} value={finish}>
                      {formatOptionLabel(finish)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {product.options.dimensions && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Dimensiones
              </label>
              {product.options.dimensions.length === 1 ? (
                <Tooltip text={TOOLTIP_TEXT}>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedOptions.dimensions || ""}
                    disabled
                    required
                  >
                    <option
                      value={JSON.stringify(product.options.dimensions[0])}
                    >
                      {product.options.dimensions[0][0]}" x{" "}
                      {product.options.dimensions[0][1]}"
                    </option>
                  </select>
                </Tooltip>
              ) : (
                <select
                  className="w-full border rounded-md p-2"
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      dimensions: e.target.value,
                    }))
                  }
                  value={selectedOptions.dimensions || ""}
                  required
                >
                  <option value="">Seleccionar dimensiones</option>
                  {product.options.dimensions.map((dim) => (
                    <option key={dim.join("x")} value={JSON.stringify(dim)}>
                      {dim[0]}" x {dim[1]}"
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const val =
                  e.target.value === "" ? "" : parseInt(e.target.value);
                setQuantity(val);
              }}
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
              disabled={!isFormComplete()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar al carrito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
