"use client";

import { Edit2, Image as ImageIcon, MoreVertical } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Product } from "@/database";
import { formatCents } from "@/utils";

interface ProductsTableProps {
  products: Product<true>[];
  selectedProductId?: string;
  onProductSelect: (product: Product<true>) => void;
  onProductUpdate: () => void;
}

export function ProductsTable({
  products,
  selectedProductId,
  onProductSelect,
  onProductUpdate,
}: ProductsTableProps) {
  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium">Imagen</th>
            <th className="text-left p-4 font-medium">Nombre</th>
            <th className="text-left p-4 font-medium">Precio Base</th>
            <th className="text-left p-4 font-medium">Mínimo</th>
            <th className="text-left p-4 font-medium">Estado</th>
            <th className="text-left p-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                selectedProductId === product.id ? "bg-primary/5" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                onProductSelect(product);
              }}
            >
              <td className="p-4">
                {product.images[0] ? (
                  <div className="relative w-12 h-12">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </td>
              <td className="p-4 capitalize">{product.name}</td>
              <td className="p-4">
                {formatCents(product.pricing.baseUnitPrice)}
              </td>
              <td className="p-4">
                {formatCents(product.pricing.minimumPurchase)}
              </td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.isPublic
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {product.isPublic ? "Publicado" : "Borrador"}
                </span>
              </td>
              <td className="p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">Abrir menú</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductUpdate();
                      }}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
