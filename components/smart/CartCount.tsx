"use client";

import { useCart } from "@/hooks/useCart";

export function CartCount() {
  const totalItems = useCart((state) => state.totalItems());

  if (totalItems === 0) {
    return null;
  }

  return (
    <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
      {totalItems}
    </span>
  );
}
