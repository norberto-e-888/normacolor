/* eslint-disable react/no-unescaped-entities */
"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Tooltip } from "@/components/ui";
import {
  OrderProductOptions,
  Product,
  ProductOptionFinish,
  ProductOptionPaper,
  ProductOptionSide,
  ProductPricingOptionMultipliers,
} from "@/database";
import { useCart } from "@/hooks/useCart";
import { formatCents } from "@/utils";

const formatOptionLabel = (option: string) => {
  return option
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase());
};

const TOOLTIP_TEXT = "única opción disponible";

export function ProductCard({ product }: { product: Product }) {
  const getDefaultOptions = useCallback(() => {
    const defaultOptions: OrderProductOptions = {};

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
      defaultOptions.dimensions = product.options.dimensions[0];
    }

    return defaultOptions;
  }, [
    product.options.dimensions,
    product.options.finish,
    product.options.paper,
    product.options.sides,
  ]);

  const [selectedOptions, setSelectedOptions] = useState<OrderProductOptions>(
    getDefaultOptions()
  );

  const [quantity, setQuantity] = useState<number | "">(1);
  const addItem = useCart((state) => state.addItem);
  const calculatePrice = useCallback(() => {
    const qty = typeof quantity === "number" ? quantity : 0;
    if (!qty || qty < 1) return 0;

    let price = product.pricing.baseUnitPrice;

    // Apply option multipliers
    Object.entries(selectedOptions).forEach(([key, value]) => {
      const optionMultiplier =
        product.pricing.optionMultipliers[
          key as keyof ProductPricingOptionMultipliers
        ];

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

    return Math.round(price * qty);
  }, [
    product.pricing.baseUnitPrice,
    product.pricing.optionMultipliers,
    product.pricing.quantityDiscountMultipliers,
    quantity,
    selectedOptions,
  ]);

  const getValidationMessages = useMemo(() => {
    const messages: string[] = [];
    const totalPrice = calculatePrice();

    // Check required options
    if (product.options.sides?.length && !selectedOptions.sides) {
      messages.push("Selecciona los lados");
    }
    if (product.options.paper?.length && !selectedOptions.paper) {
      messages.push("Selecciona el papel");
    }
    if (product.options.finish?.length && !selectedOptions.finish) {
      messages.push("Selecciona el acabado");
    }
    if (product.options.dimensions?.length && !selectedOptions.dimensions) {
      messages.push("Selecciona las dimensiones");
    }
    if (typeof quantity !== "number" || quantity < 1) {
      messages.push("Ingresa una cantidad válida");
    }
    if (totalPrice < product.pricing.minimumPurchase) {
      messages.push(
        `El monto mínimo de compra es ${formatCents(
          product.pricing.minimumPurchase
        )}`
      );
    }

    return messages;
  }, [
    product.options.sides,
    product.options.paper,
    product.options.finish,
    product.options.dimensions,
    product.pricing.minimumPurchase,
    selectedOptions,
    quantity,
    calculatePrice,
  ]);

  const isFormComplete = useCallback(() => {
    return getValidationMessages.length === 0;
  }, [getValidationMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof quantity !== "number") return;

    const totalPrice = calculatePrice();
    if (totalPrice < product.pricing.minimumPurchase) {
      toast.error(
        `El monto mínimo de compra es ${formatCents(
          product.pricing.minimumPurchase
        )}`,
        {
          closeButton: true,
        }
      );
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      quantity,
      options: selectedOptions,
      price: totalPrice,
    });

    // Reset form while keeping default values
    setSelectedOptions(getDefaultOptions());
    setQuantity(1);

    // Show success toast
    toast.success(
      `${quantity} ${product.name} agregado${
        quantity > 1 ? "s" : ""
      } al carrito`,
      {
        closeButton: true,
      }
    );
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-6 hover:border-primary transition-colors w-full max-w-sm h-full flex flex-col">
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <span className="text-2xl text-muted-foreground">📄</span>
      </div>

      <div className="mt-4 flex-1 flex flex-col">
        <h2 className="text-lg font-semibold capitalize">{product.name}</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex-1 flex flex-col">
          <div className="space-y-4 flex-1">
            {!!product.options.sides?.length && (
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
                        sides: e.target.value as ProductOptionSide,
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

            {!!product.options.paper?.length && (
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
                        paper: e.target.value as ProductOptionPaper,
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

            {!!product.options.finish?.length && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Acabado
                </label>
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
                        finish: e.target.value as ProductOptionFinish,
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

            {!!product.options.dimensions?.length && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Dimensiones
                </label>
                {product.options.dimensions.length === 1 ? (
                  <Tooltip text={TOOLTIP_TEXT}>
                    <select
                      className="w-full border rounded-md p-2"
                      value={JSON.stringify(selectedOptions.dimensions)}
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
                        dimensions: e.target.value
                          ? JSON.parse(e.target.value)
                          : undefined,
                      }))
                    }
                    value={JSON.stringify(selectedOptions.dimensions)}
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
          </div>

          <div className="mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">
                {formatCents(calculatePrice())}
              </span>
              <Tooltip
                text={getValidationMessages.join("\n")}
                show={!isFormComplete()}
              >
                <button
                  type="submit"
                  disabled={!isFormComplete()}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar al carrito
                </button>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Mínimo de compra: {formatCents(product.pricing.minimumPurchase)}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}