"use client";

import { createContext, useContext, useState } from "react";

type ProductFormContextType = {
  openFormId: string | null;
  setOpenFormId: (id: string | null) => void;
};

const ProductFormContext = createContext<ProductFormContextType | undefined>(
  undefined
);

export function ProductFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  return (
    <ProductFormContext.Provider value={{ openFormId, setOpenFormId }}>
      {children}
    </ProductFormContext.Provider>
  );
}

export function useProductForm() {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error("useProductForm must be used within a ProductFormProvider");
  }
  return context;
}
