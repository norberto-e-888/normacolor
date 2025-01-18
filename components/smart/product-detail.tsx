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

interface ProductDetailProps {
  product: Product<true> | null;
  onUpdate: () => void;
}

export function ProductDetail({ product, onUpdate }: ProductDetailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product<true>>>({});

  useEffect(() => {
    if (product) {
      setFormData(product);
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
    newMultipliers[index][field] = value;

    // Sort by threshold in descending order
    newMultipliers.sort((a, b) => b[0] - a[0]);

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

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold">Detalles del Producto</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <Input
            value={formData?.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Precio Base (centavos)
          </label>
          <Input
            type="number"
            value={formData?.pricing?.baseUnitPrice}
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
            value={formData?.pricing?.minimumPurchase}
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
          <h3 className="text-sm font-medium">Multiplicadores de Opciones</h3>

          {/* Sides Multipliers */}
          {!!product.options.sides?.length && (
            <div className="space-y-2">
              <h4 className="text-sm text-muted-foreground">Lados</h4>
              <div className="grid gap-2">
                {product.options.sides.map((side) => (
                  <div key={side} className="flex items-center gap-2">
                    <span className="text-sm w-24 capitalize">{side}</span>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={
                        formData.pricing?.optionMultipliers?.sides?.[side] || ""
                      }
                      onChange={(e) =>
                        updateOptionMultiplier(
                          "sides",
                          side,
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
          {!!product.options.finish?.length && (
            <div className="space-y-2">
              <h4 className="text-sm text-muted-foreground">Acabado</h4>
              <div className="grid gap-2">
                {product.options.finish.map((finish) => (
                  <div key={finish} className="flex items-center gap-2">
                    <span className="text-sm w-24 capitalize">{finish}</span>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={
                        formData.pricing?.optionMultipliers?.finish?.[finish] ||
                        ""
                      }
                      onChange={(e) =>
                        updateOptionMultiplier(
                          "finish",
                          finish,
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
          {!!product.options.paper?.length && (
            <div className="space-y-2">
              <h4 className="text-sm text-muted-foreground">Papel</h4>
              <div className="grid gap-2">
                {product.options.paper.map((paper) => (
                  <div key={paper} className="flex items-center gap-2">
                    <span className="text-sm w-24 capitalize">{paper}</span>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={
                        formData.pricing?.optionMultipliers?.paper?.[paper] ||
                        ""
                      }
                      onChange={(e) =>
                        updateOptionMultiplier(
                          "paper",
                          paper,
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
          {!!product.options.dimensions?.length && (
            <div className="space-y-2">
              <h4 className="text-sm text-muted-foreground">Dimensiones</h4>
              <div className="grid gap-2">
                {product.options.dimensions.map((dimension) => {
                  const key = JSON.stringify(dimension);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm w-24">
                        {dimension[0]}" x {dimension[1]}"
                      </span>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={
                          formData.pricing?.optionMultipliers?.dimensions?.[
                            key
                          ] || ""
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
            {formData.pricing?.quantityDiscountMultipliers?.map(
              ([threshold, multiplier], index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={threshold}
                    onChange={(e) =>
                      updateQuantityDiscount(index, 0, parseInt(e.target.value))
                    }
                    className="w-24"
                    placeholder="Cantidad"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={multiplier}
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
              )
            )}
          </div>
        </div>

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
