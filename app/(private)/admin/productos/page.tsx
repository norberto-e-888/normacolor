"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Product } from "@/database";
import { useProducts } from "@/hooks/use-products";
import { ProductsTable } from "@/components/smart/products-table";
import { ProductDetail } from "@/components/smart/product-detail";

export default function AdminProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product<true> | null>(
    null
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const { data, isLoading, refetch } = useProducts();
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProductName }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.details?.name) {
          throw new Error(data.details.name[0]);
        }
        throw new Error(data.error || "Failed to create product");
      }

      await refetch();
      setIsCreateModalOpen(false);
      setNewProductName("");
      toast.success("Producto creado exitosamente");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear el producto"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Content>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Content>
    );
  }

  return (
    <Content title="Productos">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end mb-6">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Products Table */}
          <div className="w-full lg:w-2/3 overflow-auto border rounded-lg">
            <ProductsTable
              products={data || []}
              selectedProductId={selectedProduct?.id}
              onProductSelect={setSelectedProduct}
              onProductUpdate={refetch}
            />
          </div>

          {/* Detail Panel */}
          <div className="hidden lg:block w-1/3 overflow-auto">
            <ProductDetail product={selectedProduct} onUpdate={refetch} />
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewProductName("");
        }}
      >
        <div className="w-[600px] max-w-full p-6">
          <h2 className="text-2xl font-bold mb-6">Nuevo Producto</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del producto
              </label>
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Ej: Tarjetas de presentación"
                required
                minLength={3}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewProductName("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  "Crear Producto"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </Content>
  );
}
