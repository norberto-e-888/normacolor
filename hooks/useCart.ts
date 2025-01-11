import { v4 as uuid } from "uuid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { OrderArt, ProductOptions } from "@/database";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  options: Partial<ProductOptions>;
  art?: OrderArt;
  price: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItemArt: (id: string, art: OrderArt) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: uuid(),
            },
          ],
        }));
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateItemArt: (id, art) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, art } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.length,
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price, 0),
    }),
    {
      name: "cart-storage",
    }
  )
);
