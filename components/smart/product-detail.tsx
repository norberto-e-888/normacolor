"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Product,
  ProductOptionFinish,
  ProductOptionPaper,
  ProductOptionSide,
} from "@/database";
import { DeepPartial } from "@/utils/deep-partial";

type Tab = "options" | "pricing";

interface ProductDetailProps {
  product: Product<true> | null;
  onUpdate: () => void;
}

export function ProductDetail({ product, onUpdate }: ProductDetailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DeepPartial<Product<true>>>({
    name: "",
    isPublic: false,
    options: {
      sides: [],
      finish: [],
      paper: [],
      dimensions: [],
    },
    pricing: {
      baseUnitPrice: 0,
      minimumPurchase: 0,
      optionMultipliers: {
        sides: {},
        finish: {},
        paper: {},
        dimensions: {},
      },
      quantityDiscountMultipliers: [],
    },
  });

  const [activeTab, setActiveTab] = useState<Tab>("options");

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        isPublic: product.isPublic || false,
        options: {
          sides: product.options?.sides || [],
          finish: product.options?.finish || [],
          paper: product.options?.paper || [],
          dimensions: product.options?.dimensions || [],
        },
        pricing: {
          baseUnitPrice: product.pricing?.baseUnitPrice || 0,
          minimumPurchase: product.pricing?.minimumPurchase || 0,
          optionMultipliers: {
            sides: product.pricing?.optionMultipliers?.sides || {},
            finish: product.pricing?.optionMultipliers?.finish || {},
            paper: product.pricing?.optionMultipliers?.paper || {},
            dimensions: product.pricing?.optionMultipliers?.dimensions || {},
          },
          quantityDiscountMultipliers:
            product.pricing?.quantityDiscountMultipliers || [],
        },
      });
    }
  }, [product]);

  if (!product) {
    return (
      <div className="border rounded-lg p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Selecciona un producto para ver sus detalles
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      toast.success("Producto actualizado exitosamente");
      onUpdate();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error al actualizar el producto");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOptionMultiplier = (
    optionType: keyof Product["pricing"]["optionMultipliers"],
    optionValue: string,
    multiplier: number
  ) => {
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing!,
        optionMultipliers: {
          ...formData.pricing?.optionMultipliers,
          [optionType]: {
            ...formData.pricing?.optionMultipliers?.[optionType],
            [optionValue]: multiplier,
          },
        },
      },
    });
  };

  const addQuantityDiscount = () => {
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing!,
        quantityDiscountMultipliers: [
          ...(formData.pricing?.quantityDiscountMultipliers || []),
          [100, 0.9], // Default values
        ],
      },
    });
  };

  const updateQuantityDiscount = (
    index: number,
    field: 0 | 1,
    value: number
  ) => {
    const newMultipliers = [
      ...(formData.pricing?.quantityDiscountMultipliers || []),
    ];

    if (newMultipliers[index]) {
      newMultipliers[index][field] = value;
    }

    // Sort by threshold in descending order
    newMultipliers
      .filter(Boolean)
      .sort((a, b) => (b as [number])[0] - (a as number[])[0]);

    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing!,
        quantityDiscountMultipliers: newMultipliers,
      },
    });
  };

  const removeQuantityDiscount = (index: number) => {
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing!,
        quantityDiscountMultipliers:
          formData.pricing?.quantityDiscountMultipliers?.filter(
            (_, i) => i !== index
          ) || [],
      },
    });
  };

  const updateOptions = <
    T extends ProductOptionSide | ProductOptionFinish | ProductOptionPaper
  >(
    optionType: keyof Omit<Product["options"], "dimensions">,
    value: T
  ) => {
    const currentOptions = (formData.options?.[optionType] || []) as T[];
    const newOptions = currentOptions.includes(value)
      ? currentOptions.filter((v) => v !== value)
      : [...currentOptions, value];

    setFormData({
      ...formData,
      options: {
        ...formData.options,
        [optionType]: newOptions,
      },
    });
  };

  const addDimension = () => {
    setFormData({
      ...formData,
      options: {
        ...formData.options,
        dimensions: [...(formData.options?.dimensions || []), [8.5, 11]],
      },
    });
  };

  const updateDimension = (index: number, axis: 0 | 1, value: number) => {
    const newDimensions = [...(formData.options?.dimensions || [])];

    if (newDimensions[index]) {
      newDimensions[index][axis] = value;
    }

    setFormData({
      ...formData,
      options: {
        ...formData.options,
        dimensions: newDimensions,
      },
    });
  };

  const removeDimension = (index: number) => {
    setFormData({
      ...formData,
      options: {
        ...formData.options,
        dimensions: formData.options?.dimensions?.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <Input
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            <button
              type="button"
              className={`px-4 py-2 ${
                activeTab === "options"
                  ? "border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("options")}
            >
              Opciones
            </button>
            <button
              type="button"
              className={`px-4 py-2 ${
                activeTab === "pricing"
                  ? "border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("pricing")}
            >
              Precios
            </button>
          </div>
        </div>

        {activeTab === "options" ? (
          <div className="space-y-6">
            {/* Sides Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lados</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ProductOptionSide).map((side) => (
                  <label key={side} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.options?.sides?.includes(side) || false}
                      onChange={() => updateOptions("sides", side)}
                    />
                    <span className="text-sm capitalize">{side}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Finish Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Acabado</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ProductOptionFinish).map((finish) => (
                  <label key={finish} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        formData.options?.finish?.includes(finish) || false
                      }
                      onChange={() => updateOptions("finish", finish)}
                    />
                    <span className="text-sm capitalize">{finish}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Paper Options */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Papel</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ProductOptionPaper).map((paper) => (
                  <label key={paper} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        formData.options?.paper?.includes(paper) || false
                      }
                      onChange={() => updateOptions("paper", paper)}
                    />
                    <span className="text-sm capitalize">{paper}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Dimensiones</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDimension}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Dimensión
                </Button>
              </div>
              <div className="space-y-2">
                {formData.options?.dimensions
                  ?.filter(Boolean)
                  .map((dimension, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(dimension as [number, number])[0] || 0}
                        onChange={(e) =>
                          updateDimension(index, 0, parseFloat(e.target.value))
                        }
                        className="w-24"
                      />
                      <span>x</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(dimension as [number, number])[1] || 0}
                        onChange={(e) =>
                          updateDimension(index, 1, parseFloat(e.target.value))
                        }
                        className="w-24"
                      />
                      <span>pulgadas</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDimension(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Precio Base (centavos)
              </label>
              <Input
                type="number"
                value={formData?.pricing?.baseUnitPrice || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: {
                      ...formData?.pricing!,
                      baseUnitPrice: parseInt(e.target.value),
                    },
                  })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Compra Mínima (centavos)
              </label>
              <Input
                type="number"
                value={formData?.pricing?.minimumPurchase || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricing: {
                      ...formData?.pricing!,
                      minimumPurchase: parseInt(e.target.value),
                    },
                  })
                }
                required
              />
            </div>

            {/* Option Multipliers */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                Multiplicadores de Opciones
              </h3>

              {/* Sides Multipliers */}
              {!!formData.options?.sides?.length && (
                <div className="space-y-2">
                  <h4 className="text-sm text-muted-foreground">Lados</h4>
                  <div className="grid gap-2">
                    {formData.options.sides.filter(Boolean).map((side) => (
                      <div key={side} className="flex items-center gap-2">
                        <span className="text-sm w-24 capitalize">{side}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            formData.pricing?.optionMultipliers?.sides?.[
                              side as ProductOptionSide
                            ] || 1
                          }
                          onChange={(e) =>
                            updateOptionMultiplier(
                              "sides",
                              side as ProductOptionSide,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Finish Multipliers */}
              {!!formData.options?.finish?.length && (
                <div className="space-y-2">
                  <h4 className="text-sm text-muted-foreground">Acabado</h4>
                  <div className="grid gap-2">
                    {formData.options.finish.filter(Boolean).map((finish) => (
                      <div key={finish} className="flex items-center gap-2">
                        <span className="text-sm w-24 capitalize">
                          {finish}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            formData.pricing?.optionMultipliers?.finish?.[
                              finish as ProductOptionFinish
                            ] || 1
                          }
                          onChange={(e) =>
                            updateOptionMultiplier(
                              "finish",
                              finish as ProductOptionFinish,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paper Multipliers */}
              {!!formData.options?.paper?.length && (
                <div className="space-y-2">
                  <h4 className="text-sm text-muted-foreground">Papel</h4>
                  <div className="grid gap-2">
                    {formData.options.paper.filter(Boolean).map((paper) => (
                      <div key={paper} className="flex items-center gap-2">
                        <span className="text-sm w-24 capitalize">{paper}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            formData.pricing?.optionMultipliers?.paper?.[
                              paper as ProductOptionPaper
                            ] || 1
                          }
                          onChange={(e) =>
                            updateOptionMultiplier(
                              "paper",
                              paper as ProductOptionPaper,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dimensions Multipliers */}
              {!!formData.options?.dimensions?.length && (
                <div className="space-y-2">
                  <h4 className="text-sm text-muted-foreground">Dimensiones</h4>
                  <div className="grid gap-2">
                    {formData.options.dimensions
                      .filter(Boolean)
                      .map((dimension) => {
                        const key = JSON.stringify(dimension);
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm w-24">
                              {(dimension as [number, number])[0]}" x{" "}
                              {(dimension as [number, number])[1]}"
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={
                                formData.pricing?.optionMultipliers
                                  ?.dimensions?.[key] || 1
                              }
                              onChange={(e) =>
                                updateOptionMultiplier(
                                  "dimensions",
                                  key,
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-24"
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Discount Multipliers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Descuentos por Cantidad</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuantityDiscount}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Descuento
                </Button>
              </div>

              <div className="space-y-2">
                {formData.pricing?.quantityDiscountMultipliers
                  ?.filter(Boolean)
                  .map((discount, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={(discount as [number, number])[0] || 0}
                        onChange={(e) =>
                          updateQuantityDiscount(
                            index,
                            0,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-24"
                        placeholder="Cantidad"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={(discount as [number, number])[1] || 0}
                        onChange={(e) =>
                          updateQuantityDiscount(
                            index,
                            1,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-24"
                        placeholder="Multiplicador"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuantityDiscount(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData?.isPublic}
            onChange={(e) =>
              setFormData({
                ...formData,
                isPublic: e.target.checked,
              })
            }
          />
          <label htmlFor="isPublic" className="text-sm font-medium">
            Publicado
          </label>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            "Guardar Cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
