"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
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
  const { data, isLoading, refetch } = useProducts();

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
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="w-[600px] max-w-full p-6">
          <h2 className="text-2xl font-bold mb-6">Nuevo Producto</h2>
          <p className="text-muted-foreground">
            El formulario de creación irá aquí
          </p>
        </div>
      </Modal>
    </Content>
  );
}
