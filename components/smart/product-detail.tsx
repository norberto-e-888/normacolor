"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/database";

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

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold">Detalles del Producto</h2>

      <div className="space-y-4">
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
                  optionMultipliers: formData?.pricing?.optionMultipliers || {},
                  quantityDiscountMultipliers:
                    formData?.pricing?.quantityDiscountMultipliers || [],
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
                  baseUnitPrice: formData?.pricing?.baseUnitPrice || 0,
                  optionMultipliers: formData?.pricing?.optionMultipliers || {},
                  quantityDiscountMultipliers:
                    formData?.pricing?.quantityDiscountMultipliers || [],
                },
              })
            }
            required
          />
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
