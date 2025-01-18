"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
import { Modal } from "@/components/ui/modal";
import { ProductsTable } from "@/components/smart/products-table";
import { Product } from "@/database";
import { useProducts } from "@/hooks/use-products";

export default function AdminProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product<true> | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data, isLoading } = useProducts();

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
    <Content>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Productos</h1>
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
            />
          </div>

          {/* Detail Panel */}
          <div className="hidden lg:block w-1/3 overflow-auto">
            {selectedProduct ? (
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedProduct.name}
                </h2>
                <div className="space-y-4">
                  {/* We'll implement the detail form later */}
                  <p className="text-muted-foreground">
                    Select a product to view and edit its details
                  </p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-6 flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a product to view its details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Product Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <div className="w-[600px] max-w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Nuevo Producto</h2>
            {/* We'll implement the create form later */}
            <p className="text-muted-foreground">
              Product creation form will go here
            </p>
          </div>
        </Modal>
      </div>
    </Content>
  );
}
